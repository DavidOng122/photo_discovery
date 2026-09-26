import type { RecommendationOutput } from '@/lib/ai/schemas';

export interface GooglePlacesEnrichment {
  googlePlaceId?: string | null;
  formattedAddress?: string | null;
  imageUrl?: string | null;
}

function toPhotoUrl(photoReference: string): string {
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1200&photoreference=${encodeURIComponent(photoReference)}&key=${encodeURIComponent(process.env.GOOGLE_PLACES_API_KEY ?? '')}`;
}

export async function enrichPlaceResultsWithGooglePlaces(
  result: RecommendationOutput
): Promise<RecommendationOutput> {
  if (!process.env.GOOGLE_PLACES_API_KEY) {
    return result;
  }

  const enrichedPlaces = await Promise.all(
    result.places.map(async (place) => {
      try {
        const query = [place.name, place.area, '東京'].filter(Boolean).join(' ') || place.googleMapsQuery;
        const res = await fetch(
          `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${encodeURIComponent(process.env.GOOGLE_PLACES_API_KEY ?? '')}`,
          { cache: 'no-store' }
        );
        const data = await res.json();

        const candidate = Array.isArray(data?.results) && data.results.length > 0 ? data.results[0] : null;
        if (!candidate) {
          return {
            ...place,
            googlePlaceId: place.googlePlaceId ?? null,
            formattedAddress: place.formattedAddress ?? null,
            imageUrl: place.imageUrl ?? null,
          };
        }

        const photoReference = candidate?.photos?.[0]?.photo_reference;
        return {
          ...place,
          googlePlaceId: candidate.place_id ?? place.googlePlaceId ?? null,
          formattedAddress: candidate.formatted_address ?? place.formattedAddress ?? null,
          imageUrl: photoReference ? toPhotoUrl(photoReference) : place.imageUrl ?? null,
        };
      } catch {
        return {
          ...place,
          googlePlaceId: place.googlePlaceId ?? null,
          formattedAddress: place.formattedAddress ?? null,
          imageUrl: place.imageUrl ?? null,
        };
      }
    })
  );

  return { ...result, places: enrichedPlaces };
}
