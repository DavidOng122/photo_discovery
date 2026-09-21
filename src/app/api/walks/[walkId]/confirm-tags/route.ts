import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/getCurrentUser';

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

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ error: { code: 'INVALID_REQUEST', message: 'Invalid JSON body' } }, { status: 400 });
    }

    const { selectedTagIds } = body;
    if (!selectedTagIds || !Array.isArray(selectedTagIds)) {
      return NextResponse.json({ error: { code: 'INVALID_TAG_SELECTION', message: 'selectedTagIds must be an array' } }, { status: 400 });
    }

    // Server validate count
    if (selectedTagIds.length < 1 || selectedTagIds.length > 3) {
      return NextResponse.json({ error: { code: 'INVALID_TAG_SELECTION', message: 'Must select between 1 and 3 tags' } }, { status: 400 });
    }

    // Verify all IDs are unique strings
    const uniqueIds = new Set(selectedTagIds);
    if (uniqueIds.size !== selectedTagIds.length) {
      return NextResponse.json({ error: { code: 'INVALID_TAG_SELECTION', message: 'Duplicate tag IDs found' } }, { status: 400 });
    }
    
    for (const id of selectedTagIds) {
      if (typeof id !== 'string') {
         return NextResponse.json({ error: { code: 'INVALID_TAG_SELECTION', message: 'Tag ID must be a string' } }, { status: 400 });
      }
    }

    const supabase = await createClient();

    const { error: rpcError } = await supabase.rpc('confirm_discovery_tags', {
      p_walk_id: walkId,
      p_selected_tag_ids: selectedTagIds
    });

    if (rpcError) {
      console.error('confirm_discovery_tags RPC error:', rpcError);
      
      // Parse RPC error messages
      if (rpcError.message.includes('Walk not found')) {
        return NextResponse.json({ error: { code: 'WALK_NOT_FOUND', message: 'Walk not found or access denied' } }, { status: 404 });
      }
      if (rpcError.message.includes('Invalid walk state')) {
        return NextResponse.json({ error: { code: 'INVALID_WALK_STATE', message: 'Walk state is not TAG_SELECTION' } }, { status: 400 });
      }
      if (rpcError.message.includes('One or more tags are invalid')) {
        return NextResponse.json({ error: { code: 'TAG_NOT_FOUND', message: 'Selected tags are invalid or do not belong to this walk' } }, { status: 400 });
      }

      return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: '選択した発見を保存できませんでした。' } }, { status: 500 });
    }

    return NextResponse.json({
      walkId,
      status: 'RECOMMENDING',
      selectedTagIds
    });

  } catch (error: any) {
    console.error('Unhandled error in confirm-tags route:', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: '選択した発見を保存できませんでした。' } }, { status: 500 });
  }
}
