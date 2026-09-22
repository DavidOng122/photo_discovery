import { redirect, notFound } from 'next/navigation';
import { PageContainer } from '@/components/common/PageContainer';
import { getWalkDetail } from '@/lib/walks/getWalkDetail';
import { WalkTitleEditor } from '@/components/walk/WalkTitleEditor';
import { WalkHeader } from '@/components/walk/WalkHeader';
import { WalkPhotoGrid } from '@/components/walk/WalkPhotoGrid';
import { WalkSelectedTags } from '@/components/walk/WalkSelectedTags';
import { WalkRecommendations } from '@/components/walk/WalkRecommendations';
import { WalkDeleteButton } from '@/components/walk/WalkDeleteButton';

export const dynamic = 'force-dynamic';

export default async function WalkDetailPage({
  params,
}: {
  params: Promise<{ walkId: string }>;
}) {
  const { walkId } = await params;
  const walk = await getWalkDetail(walkId);

  if (!walk) {
    notFound();
  }

  // Route incomplete walks to their appropriate pages
  if (walk.status === 'DRAFT' || walk.status === 'ANALYZING' || walk.status === 'TAG_SELECTION') {
    redirect(`/walk/${walkId}/discover`);
  }
  if (walk.status === 'RECOMMENDING') {
    redirect(`/walk/${walkId}/recommendations`);
  }

  return (
    <PageContainer>
      {/* Title with inline edit */}
      <WalkTitleEditor walkId={walk.id} initialTitle={walk.title} />

      {/* Location + date */}
      <WalkHeader location={walk.location} createdAt={walk.createdAt} />

      {/* Photos */}
      <WalkPhotoGrid photos={walk.photos} />

      {/* Selected Discovery Tags */}
      <WalkSelectedTags tags={walk.selectedTags} />

      {/* Recommendation cards */}
      <WalkRecommendations places={walk.recommendations} />

      {/* Delete */}
      <WalkDeleteButton walkId={walk.id} />
    </PageContainer>
  );
}
