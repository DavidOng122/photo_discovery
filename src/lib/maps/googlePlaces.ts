import type { RecommendationOutput } from '@/lib/ai/schemas';

export interface EnrichedPlace {
  type?: "area" | "place";
  matchedFeatures: string[];
  name: string;
  area: string | null;
  reason: string;
  googleMapsQuery: string;
  googlePlaceId: string | null;
  formattedAddress: string | null;
  googlePhotoReference: string | null;
  imageUrl?: string | null;
}

export interface EnrichedRecommendationOutput {
  places: EnrichedPlace[];
}

// ─── Places API (New) types ──────────────────────────────────────────────────

interface NewPlacesPhoto {
  name: string; // e.g. "places/{placeId}/photos/{photoId}"
}

interface NewPlacesCandidate {
  id: string;           // place_id in new API
  displayName?: { text: string; languageCode?: string };
  formattedAddress?: string;
  photos?: NewPlacesPhoto[];
}

interface NewPlacesSearchResponse {
  places?: NewPlacesCandidate[];
  error?: { code: number; message: string; status: string };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getGooglePlacesApiKey(): string | undefined {
  return process.env.GOOGLE_PLACES_API_KEY ?? process.env.GOOGLE_API_KEY;
}

function normalizeName(name: string): string {
  return name.replace(/\s+/g, '').toLowerCase();
}

function isNameMatch(requestedName: string, googleName: string): boolean {
  const req = normalizeName(requestedName);
  const goog = normalizeName(googleName);
  return req.includes(goog) || goog.includes(req);
}

// ─── Main export ─────────────────────────────────────────────────────────────

export async function enrichPlaceResultsWithGooglePlaces(
  result: RecommendationOutput
): Promise<EnrichedRecommendationOutput> {
  const apiKey = getGooglePlacesApiKey();

  if (!apiKey) {
    if (process.env.MOCK_GOOGLE_PLACES === 'true') {
      return {
        places: result.places.map((place) => ({
          name: place.name,
          area: place.area ?? null,
          reason: place.reason,
          googleMapsQuery: place.googleMapsQuery,
          type: place.type,
          matchedFeatures: place.matchedFeatures,
          googlePlaceId: `mock_place_id_${place.name}`,
          formattedAddress: `Mock Address, Tokyo`,
          googlePhotoReference: null,
          imageUrl: place.imageUrl ?? null,
        }))
      };
    }
    console.warn('GOOGLE_PLACES_API_KEY is missing, returning places without enrichment');
    return {
      places: result.places.map((place) => ({
        name: place.name,
        area: place.area ?? null,
        reason: place.reason,
        googleMapsQuery: place.googleMapsQuery,
        type: place.type,
        matchedFeatures: place.matchedFeatures,
        googlePlaceId: null,
        formattedAddress: null,
        googlePhotoReference: null,
        imageUrl: place.imageUrl ?? null,
      }))
    };
  }

  const seenPlaceIds = new Set<string>();

  const enrichedPlaces = await Promise.all(
    result.places.map(async (place) => {
      try {
        const textQuery = [place.name, place.area, '東京'].filter(Boolean).join(' ') || place.googleMapsQuery;

        const res = await fetch(
          'https://places.googleapis.com/v1/places:searchText',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': apiKey,
              'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.photos',
            },
            body: JSON.stringify({ textQuery }),
            cache: 'no-store',
          }
        );

        if (!res.ok) {
          const body = await res.text().catch(() => '');
          console.warn(`Google Places search returned HTTP ${res.status}: ${body.slice(0, 150)}`);
          return {
            name: place.name,
            area: place.area ?? null,
            reason: place.reason,
            googleMapsQuery: place.googleMapsQuery,
            type: place.type,
            matchedFeatures: place.matchedFeatures,
            googlePlaceId: null,
            formattedAddress: null,
            googlePhotoReference: null,
            imageUrl: place.imageUrl ?? null,
          } satisfies EnrichedPlace;
        }

        const data = (await res.json()) as NewPlacesSearchResponse;

        if (data.error || !Array.isArray(data?.places) || data.places.length === 0) {
          return {
            name: place.name,
            area: place.area ?? null,
            reason: place.reason,
            googleMapsQuery: place.googleMapsQuery,
            type: place.type,
            matchedFeatures: place.matchedFeatures,
            googlePlaceId: null,
            formattedAddress: null,
            googlePhotoReference: null,
            imageUrl: place.imageUrl ?? null,
          } satisfies EnrichedPlace;
        }

        const bestCandidate = data.places.find((candidate) => {
          const candidateName = candidate.displayName?.text ?? '';
          const nameMatches = isNameMatch(place.name, candidateName);
          const address = candidate.formattedAddress || '';
          const inTokyo = address.includes('東京') || address.includes('Tokyo');
          return nameMatches && inTokyo && candidate.id;
        }) ?? data.places[0];

        const placeId = bestCandidate?.id ?? null;
        if (placeId && seenPlaceIds.has(placeId)) {
          // If duplicate ID, still display without error
        } else if (placeId) {
          seenPlaceIds.add(placeId);
        }

        const photoName = bestCandidate?.photos?.[0]?.name ?? null;
        const imageUrl = photoName
          ? `/api/places/photo?name=${encodeURIComponent(photoName)}`
          : place.imageUrl ?? null;

        return {
          name: place.name,
          area: place.area ?? null,
          reason: place.reason,
          googleMapsQuery: place.googleMapsQuery,
          type: place.type,
          matchedFeatures: place.matchedFeatures,
          googlePlaceId: placeId,
          formattedAddress: bestCandidate?.formattedAddress ?? null,
          googlePhotoReference: photoName,
          imageUrl,
        } satisfies EnrichedPlace;
      } catch (err) {
        console.warn(`Google Places enrichment error for ${place.name}:`, err);
        return {
          name: place.name,
          area: place.area ?? null,
          reason: place.reason,
          googleMapsQuery: place.googleMapsQuery,
          type: place.type,
          matchedFeatures: place.matchedFeatures,
          googlePlaceId: null,
          formattedAddress: null,
          googlePhotoReference: null,
          imageUrl: place.imageUrl ?? null,
        } satisfies EnrichedPlace;
      }
    })
  );

  return { places: enrichedPlaces };
}
