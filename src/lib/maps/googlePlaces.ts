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
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  // Explicit test-only mock — never triggers in real dev/prod
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
        }))
      };
    }
    throw new Error('GOOGLE_PLACES_API_KEY is missing');
  }

  const seenPlaceIds = new Set<string>();

  const enrichedPlaces = await Promise.all(
    result.places.map(async (place) => {
      const textQuery = [place.name, place.area, '東京'].filter(Boolean).join(' ') || place.googleMapsQuery;

      // Use the Places API (New) Text Search endpoint
      const res = await fetch(
        'https://places.googleapis.com/v1/places:searchText',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            // Only request the fields we need — keeps billing minimal
            'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.photos',
          },
          body: JSON.stringify({ textQuery }),
          cache: 'no-store',
        }
      );

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`GOOGLE_PLACE_VERIFICATION_FAILED: Places API (New) HTTP ${res.status} — ${body.slice(0, 200)}`);
      }

      const data = (await res.json()) as NewPlacesSearchResponse;

      if (data.error) {
        throw new Error(`GOOGLE_PLACE_VERIFICATION_FAILED: ${data.error.status} — ${data.error.message}`);
      }

      if (!Array.isArray(data?.places) || data.places.length === 0) {
        throw new Error(`GOOGLE_PLACE_VERIFICATION_FAILED: No candidate found for ${place.name}`);
      }

      // Find best match: name similarity AND in Tokyo
      const bestCandidate = data.places.find((candidate) => {
        const candidateName = candidate.displayName?.text ?? '';
        const nameMatches = isNameMatch(place.name, candidateName);
        const address = candidate.formattedAddress || '';
        const inTokyo = address.includes('東京') || address.includes('Tokyo');
        return nameMatches && inTokyo && candidate.id;
      }) ?? data.places[0]; // fallback: first result if nothing matches perfectly

      if (!bestCandidate?.id) {
        throw new Error(`GOOGLE_PLACE_VERIFICATION_FAILED: No valid candidate for ${place.name}`);
      }

      const placeId = bestCandidate.id;
      if (seenPlaceIds.has(placeId)) {
        throw new Error(`GOOGLE_PLACE_VERIFICATION_FAILED: Duplicate place_id found: ${placeId}`);
      }
      seenPlaceIds.add(placeId);

      // Photo reference: the new API returns a resource name like "places/{id}/photos/{photoId}"
      // We store this and use our proxy to serve the image server-side (key never reaches client)
      const photoName = bestCandidate.photos?.[0]?.name ?? null;

      return {
        name: place.name,
        area: place.area ?? null,
        reason: place.reason,
        googleMapsQuery: place.googleMapsQuery,
        type: place.type,
        matchedFeatures: place.matchedFeatures,
        googlePlaceId: placeId,
        formattedAddress: bestCandidate.formattedAddress ?? null,
        googlePhotoReference: photoName,
      } satisfies EnrichedPlace;
    })
  );

  return { places: enrichedPlaces };
}
