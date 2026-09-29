import { enrichPlaceResultsWithGooglePlaces } from '../src/lib/maps/googlePlaces';
import type { RecommendationOutput } from '../src/lib/ai/schemas';

// Mocks
const originalFetch = global.fetch;
let fetchMockCount = 0;

global.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  fetchMockCount++;
  const url = input.toString();

  if (url.includes('textsearch')) {
    const query = new URL(url).searchParams.get('query') || '';
    console.log('Mock fetch called with query:', query);
    
    // Simulate No Results
    if (query.includes('Fake Place')) {
      return {
        ok: true,
        json: async () => ({ results: [] })
      } as Response;
    }

    // Simulate Tokyo result
    if (query.includes('Tokyo')) {
      return {
        ok: true,
        json: async () => ({
          results: [
            {
              place_id: `place_id_${query.substring(0, 10)}`,
              name: query,
              formatted_address: `1-1-1 Tokyo, Japan`,
              photos: [{ photo_reference: `photo_${query.substring(0, 10)}` }]
            }
          ]
        })
      } as Response;
    }
    
    // Simulate Outside Tokyo
    if (query.includes('Osaka')) {
      return {
        ok: true,
        json: async () => ({
          results: [
            {
              place_id: `place_id_osaka`,
              name: query,
              formatted_address: `1-1-1 Osaka, Japan`,
              photos: []
            }
          ]
        })
      } as Response;
    }

    // Simulate No Results (Moved to top)

    // Default
    return {
      ok: true,
      json: async () => ({
        results: [
          {
            place_id: `default_place_id`,
            name: query,
            formatted_address: `1-1-1 Tokyo, Japan`
          }
        ]
      })
    } as Response;
  }

  return originalFetch(input, init);
};

async function runTests() {
  console.log('--- Google Places Validation ---');
  
  // Test 1: Valid Tokyo Results, filtering, and exactly 3 places
  const inputSuccess: RecommendationOutput = {
    places: [
      { name: 'Place 1', type: 'place', area: 'Tokyo', reason: 'r1', googleMapsQuery: 'Place 1 Tokyo', matchedFeatures: ['f1'] },
      { name: 'Place 2', type: 'place', area: 'Tokyo', reason: 'r2', googleMapsQuery: 'Place 2 Tokyo', matchedFeatures: ['f2'] },
      { name: 'Place 3', type: 'place', area: 'Tokyo', reason: 'r5', googleMapsQuery: 'Place 3 Tokyo', matchedFeatures: ['f5'] },
    ]
  };

  try {
    const result = await enrichPlaceResultsWithGooglePlaces(inputSuccess);
    
    if (result.places.length !== 3) {
      console.error(`[FAIL] Expected 3 places, got ${result.places.length}`);
    } else {
      console.log('[PASS] Exactly 3 places returned');
    }

    const allTokyo = result.places.every(p => p.formattedAddress?.includes('Tokyo'));
    if (!allTokyo) {
      console.error(`[FAIL] Expected all places to be in Tokyo`);
    } else {
      console.log('[PASS] All returned places are in Tokyo');
    }

    const uniqueIds = new Set(result.places.map(p => p.googlePlaceId)).size === result.places.length;
    if (!uniqueIds) {
      console.error(`[FAIL] Expected all place IDs to be unique`);
    } else {
      console.log('[PASS] All place IDs are unique');
    }
    
    // Check if client ever receives Google API Key
    const keyExposed = JSON.stringify(result).includes('GOOGLE_PLACES_API_KEY') || JSON.stringify(result).includes(process.env.GOOGLE_PLACES_API_KEY || 'fake_key');
    if (keyExposed) {
      console.error('[FAIL] API Key is exposed in the result!');
    } else {
      console.log('[PASS] API Key is NOT exposed to the client in the result payload');
    }
  } catch (err) {
    console.error('[FAIL] Success path threw error:', err);
  }

  console.log('\n--- Test 2: Outside Tokyo ---');
  try {
    await enrichPlaceResultsWithGooglePlaces({
      places: [{ name: 'Osaka Place', type: 'place', area: 'Osaka', reason: 'r3', googleMapsQuery: 'Osaka Place Osaka', matchedFeatures: ['f3'] }]
    });
    console.error('[FAIL] Expected error for outside Tokyo place, but it passed.');
  } catch (err: any) {
    if (err.message.includes('not in Tokyo')) {
      console.log('[PASS] Threw expected error for outside Tokyo place');
    } else {
      console.error('[FAIL] Unexpected error:', err);
    }
  }

  console.log('\n--- Test 3: No Results ---');
  try {
    await enrichPlaceResultsWithGooglePlaces({
      places: [{ name: 'Fake Place', type: 'place', area: 'Tokyo', reason: 'r4', googleMapsQuery: 'FakePlace Tokyo', matchedFeatures: ['f4'] }]
    });
    console.error('[FAIL] Expected error for no results place, but it passed.');
  } catch (err: any) {
    if (err.message.includes('No candidate found')) {
      console.log('[PASS] Threw expected error for no results');
    } else {
      console.error('[FAIL] Unexpected error:', err);
    }
  }

  // Restore fetch
  global.fetch = originalFetch;
}

runTests();
