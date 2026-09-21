import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/getCurrentUser';
import { verifyWalkOwnership } from '@/lib/walks/verifyWalkOwnership';
import { analyzeWalk } from '@/lib/ai/analyzeWalk';
import { getSignedImageUrl } from '@/lib/images/getSignedImageUrl';

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

    const supabase = await createClient();

    // Get walk and photos
    const { data: walk, error: walkError } = await supabase
      .from('walks')
      .select('status, location')
      .eq('id', walkId)
      .single();

    if (walkError || !walk) {
      return NextResponse.json({ error: { code: 'WALK_NOT_FOUND', message: 'Walk not found' } }, { status: 404 });
    }

    if (walk.status !== 'DRAFT' && walk.status !== 'ANALYZING') {
      return NextResponse.json({ error: { code: 'INVALID_WALK_STATE', message: 'Walk must be DRAFT or ANALYZING to analyze' } }, { status: 400 });
    }

    const { data: photos, error: photosError } = await supabase
      .from('walk_photos')
      .select('storage_path, sort_order')
      .eq('walk_id', walkId)
      .order('sort_order', { ascending: true });

    if (photosError || !photos || photos.length === 0 || photos.length > 10) {
      return NextResponse.json({ error: { code: 'INVALID_PHOTO_COUNT', message: 'Must have 1-10 photos' } }, { status: 400 });
    }

    // Transition to ANALYZING
    const { error: updateAnalyzingError } = await supabase
      .from('walks')
      .update({ status: 'ANALYZING' })
      .eq('id', walkId);

    if (updateAnalyzingError) {
      return NextResponse.json({ error: { code: 'AI_ANALYSIS_FAILED', message: 'Failed to update status to ANALYZING' } }, { status: 500 });
    }

    // Prepare images with signed URLs
    const images: Array<{ url: string; order: number }> = [];
    for (const photo of photos) {
      const signedUrl = await getSignedImageUrl(photo.storage_path, 3600);
      if (!signedUrl) {
        return NextResponse.json({ error: { code: 'AI_ANALYSIS_FAILED', message: 'Failed to generate signed URLs for photos' } }, { status: 500 });
      }
      images.push({ url: signedUrl, order: photo.sort_order });
    }

    // Call AI
    let analysisResult;
    try {
      analysisResult = await analyzeWalk({
        images,
        location: walk.location,
        outputLanguage: 'ja'
      });
    } catch (aiError: any) {
      console.error('AI analysis threw error:', aiError);
      return NextResponse.json({ error: { code: 'AI_ANALYSIS_FAILED', message: '写真の分析に失敗しました。' } }, { status: 500 });
    }

    // Save title and tags transactionally using Postgres RPC
    const tagsPayload = analysisResult.tags.map((tag: any) => ({
      label: tag.label,
      category: tag.category,
      reason: tag.reason,
    }));

    const { error: rpcError } = await supabase.rpc('save_discovery_analysis', {
      p_walk_id: walkId,
      p_title: analysisResult.title,
      p_tags: tagsPayload,
    });

    if (rpcError) {
      console.error('RPC Error:', rpcError);
      return NextResponse.json({ error: { code: 'AI_ANALYSIS_FAILED', message: 'Failed to save analysis results' } }, { status: 500 });
    }

    // Get the inserted tags to return
    const { data: insertedTags } = await supabase
      .from('discovery_tags')
      .select('id, label, category, reason')
      .eq('walk_id', walkId);

    return NextResponse.json({
      walkId,
      status: 'TAG_SELECTION',
      title: analysisResult.title,
      tags: insertedTags || [],
    });

  } catch (error: any) {
    console.error('Unhandled error in analyze route:', error);
    return NextResponse.json({ error: { code: 'AI_ANALYSIS_FAILED', message: '写真の分析に失敗しました。' } }, { status: 500 });
  }
}
