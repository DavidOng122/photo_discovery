import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/getCurrentUser';
import { verifyWalkOwnership } from '@/lib/walks/verifyWalkOwnership';
import { analyzeWalk } from '@/lib/ai/analyzeWalk';
import { getSignedImageUrl } from '@/lib/images/getSignedImageUrl';

export async function POST(
  _request: Request,
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

    const supabase = await createClient();

    const { data: walk, error: walkError } = await supabase
      .from('walks')
      .select('status, location')
      .eq('id', walkId)
      .single();

    if (walkError || !walk) {
      return NextResponse.json({ error: { code: 'WALK_NOT_FOUND', message: 'Walk not found' } }, { status: 404 });
    }

    // If analysis is already in progress, return 202. Do NOT restart it.
    // The client should poll GET /api/walks/[walkId] until status changes.
    if (walk.status === 'ANALYZING') {
      return NextResponse.json(
        { code: 'ANALYSIS_IN_PROGRESS', status: 'ANALYZING', walkId },
        { status: 202 }
      );
    }

    // If analysis is already done, return the current state immediately.
    if (walk.status !== 'DRAFT') {
      return NextResponse.json(
        { walkId, status: walk.status },
        { status: 200 }
      );
    }

    // Atomically claim the analysis work: only transitions from DRAFT.
    // If another request already moved it to ANALYZING, the update will match 0 rows.
    const { data: updatedWalk, error: updateError } = await supabase
      .from('walks')
      .update({ status: 'ANALYZING', analysis_started_at: new Date().toISOString() })
      .eq('id', walkId)
      .eq('status', 'DRAFT')
      .select('id')
      .single();

    if (updateError || !updatedWalk) {
      // Another concurrent request won the race — treat as in-progress.
      return NextResponse.json(
        { code: 'ANALYSIS_IN_PROGRESS', status: 'ANALYZING', walkId },
        { status: 202 }
      );
    }

    const { data: photos, error: photosError } = await supabase
      .from('walk_photos')
      .select('storage_path, sort_order, analysis_storage_path')
      .eq('walk_id', walkId)
      .order('sort_order', { ascending: true });

    if (photosError || !photos || photos.length === 0 || photos.length > 10) {
      await supabase.from('walks').update({ status: 'DRAFT', analysis_started_at: null }).eq('id', walkId);
      return NextResponse.json({ error: { code: 'INVALID_PHOTO_COUNT', message: 'Must have 1-10 photos' } }, { status: 400 });
    }

    // Build signed URLs using analysis_storage_path if available (compressed copy),
    // falling back to original. Signed URLs are used server-side only and never returned to client.
    const images: Array<{ url: string; order: number }> = [];
    for (const photo of photos) {
      const path = photo.analysis_storage_path || photo.storage_path;
      const signedUrl = await getSignedImageUrl(path, 600); // 10 minutes
      if (!signedUrl) {
        await supabase.from('walks').update({ status: 'DRAFT', analysis_started_at: null }).eq('id', walkId);
        return NextResponse.json({ error: { code: 'AI_ANALYSIS_FAILED', message: '写真の分析に失敗しました。' } }, { status: 500 });
      }
      images.push({ url: signedUrl, order: photo.sort_order });
    }

    let analysisResult;
    try {
      analysisResult = await analyzeWalk({
        images,
        location: walk.location ?? undefined,
        outputLanguage: 'ja',
      });
    } catch (aiError: unknown) {
      console.error('AI analysis error:', aiError instanceof Error ? aiError.message : 'unknown');
      await supabase.from('walks').update({ status: 'DRAFT', analysis_started_at: null }).eq('id', walkId);
      return NextResponse.json({ error: { code: 'AI_ANALYSIS_FAILED', message: '写真の分析に失敗しました。' } }, { status: 500 });
    }

    const { data, metadata } = analysisResult;
    const observations = data.observations?.length
      ? data.observations
      : data.tags.map((tag, index) => ({
          id: `tag-${index + 1}`,
          description: tag.reason,
          type: tag.type ?? tag.category ?? 'style',
          matchedFeatures: [tag.label],
        }));
    const discoveries = data.discoveries?.length
      ? data.discoveries
      : data.tags.map((tag, index) => ({
          lens: tag.type === 'culture'
            ? 'culture'
            : tag.type === 'atmosphere' || tag.category === 'Nature'
              ? 'nature'
              : 'space',
          phrase: tag.label,
          explanation: tag.reason,
          observationIds: [observations[index]?.id ?? `tag-${index + 1}`],
        }));

    const { error: rpcError } = await supabase.rpc('save_discovery_analysis_v2', {
      p_walk_id: walkId,
      p_title: data.title,
      p_observations: JSON.parse(JSON.stringify(observations)),
      p_discoveries: JSON.parse(JSON.stringify(discoveries)),
      p_analysis_version: '2.0',
      p_metrics: JSON.parse(JSON.stringify(metadata)),
    });

    if (rpcError) {
      console.error('save_discovery_analysis_v2 RPC error:', rpcError.message);
      await supabase.from('walks').update({ status: 'DRAFT', analysis_started_at: null }).eq('id', walkId);
      return NextResponse.json({ error: { code: 'AI_ANALYSIS_FAILED', message: '写真の分析に失敗しました。' } }, { status: 500 });
    }

    return NextResponse.json({
      walkId,
      status: 'TAG_SELECTION',
      title: data.title,
    });

  } catch (error: unknown) {
    console.error('Unhandled error in analyze route:', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ error: { code: 'AI_ANALYSIS_FAILED', message: '写真の分析に失敗しました。' } }, { status: 500 });
  }
}
