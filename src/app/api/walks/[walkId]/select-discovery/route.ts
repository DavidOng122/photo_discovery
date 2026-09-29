import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/getCurrentUser';
import { verifyWalkOwnership } from '@/lib/walks/verifyWalkOwnership';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ walkId: string }> }
) {
  try {
    const { walkId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    const isOwner = await verifyWalkOwnership(walkId, user.id);
    if (!isOwner) {
      return NextResponse.json({ error: { code: 'WALK_NOT_FOUND', message: 'Walk not found or access denied' } }, { status: 404 });
    }

    const body = await request.json() as { discoveryId?: unknown };
    const discoveryId = typeof body.discoveryId === 'string' ? body.discoveryId : null;

    if (!discoveryId) {
      return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'discoveryId is required' } }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: walk, error: walkError } = await supabase
      .from('walks')
      .select('status')
      .eq('id', walkId)
      .single();

    if (walkError || !walk) {
      return NextResponse.json({ error: { code: 'WALK_NOT_FOUND', message: 'Walk not found' } }, { status: 404 });
    }

    // If already past selection stage, check for idempotency or reject.
    if (walk.status === 'RECOMMENDING' || walk.status === 'COMPLETED') {
      // Check whether the submitted ID matches the already-confirmed selection.
      const { data: confirmedTag } = await supabase
        .from('discovery_tags')
        .select('id')
        .eq('walk_id', walkId)
        .eq('selected', true)
        .single();

      if (confirmedTag && confirmedTag.id === discoveryId) {
        // Idempotent: same discovery already confirmed — return existing state.
        return NextResponse.json({ walkId, status: walk.status });
      }

      // Different discovery ID submitted after confirmation — reject.
      return NextResponse.json(
        { error: { code: 'SELECTION_ALREADY_CONFIRMED', message: '視点はすでに確定しています。変更できません。' } },
        { status: 409 }
      );
    }

    if (walk.status !== 'TAG_SELECTION') {
      return NextResponse.json({ error: { code: 'INVALID_WALK_STATE', message: 'Walk must be in TAG_SELECTION state' } }, { status: 400 });
    }

    // Call RPC — this atomically validates ownership, locks to one selection, and transitions to RECOMMENDING.
    const { error: rpcError } = await supabase.rpc('confirm_discovery_v2', {
      p_walk_id: walkId,
      p_selected_discovery_id: discoveryId,
    });

    if (rpcError) {
      console.error('confirm_discovery_v2 RPC Error:', rpcError.message);
      // Map RPC-level rejection to stable client codes
      if (rpcError.message.includes('already confirmed') || rpcError.message.includes('RECOMMENDING')) {
        return NextResponse.json(
          { error: { code: 'SELECTION_ALREADY_CONFIRMED', message: '視点はすでに確定しています。変更できません。' } },
          { status: 409 }
        );
      }
      if (rpcError.message.includes('does not belong')) {
        return NextResponse.json(
          { error: { code: 'INVALID_DISCOVERY_SELECTION', message: '選択した視点を確認できませんでした。もう一度お試しください。' } },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: { code: 'INVALID_DISCOVERY_SELECTION', message: '選択した視点を確認できませんでした。もう一度お試しください。' } },
        { status: 500 }
      );
    }

    return NextResponse.json({ walkId, status: 'RECOMMENDING' });

  } catch (error: unknown) {
    console.error('Unhandled error in select-discovery route:', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' } }, { status: 500 });
  }
}
