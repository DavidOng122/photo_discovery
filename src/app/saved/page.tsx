import { PageContainer } from '@/components/common/PageContainer';
import { getSavedPlaces } from '@/lib/saved/getSavedPlaces';
import { SavedPlaceList } from '@/components/saved/SavedPlaceList';

export const dynamic = 'force-dynamic';

export default async function SavedPage() {
  let places: Awaited<ReturnType<typeof getSavedPlaces>>;
  try {
    places = await getSavedPlaces();
  } catch (err) {
    console.error('Failed to load saved places:', err);
    places = [];
  }

  return (
    <PageContainer>
      <h1 style={{ fontSize: '1.5rem', margin: '0 0 1.5rem', fontWeight: 700 }}>
        保存した場所
      </h1>
      <SavedPlaceList initialPlaces={places} />
    </PageContainer>
  );
}
