import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/getCurrentUser';
import { getGooglePlacesApiKey } from '@/lib/maps/googlePlaces';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ placeId: string }> }
) {
  try {
    const { placeId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const supabase = await createClient();

    // Verify ownership: user must own the walk that contains this place.
    // Join through recommendation_sets → walks to confirm user_id.
    const { data: place, error } = await supabase
      .from('recommended_places')
      .select('google_photo_reference, recommendation_sets!inner(walks!inner(user_id))')
      .eq('id', placeId)
      .single();

    if (error || !place) {
      return new NextResponse('Not found', { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const walkUserId = (place.recommendation_sets as any).walks.user_id;
    if (walkUserId !== user.id) {
      return new NextResponse('Unauthorized', { status: 403 });
    }

    if (!place.google_photo_reference) {
      return new NextResponse('No photo available', { status: 404 });
    }

    const apiKey = getGooglePlacesApiKey();
    if (!apiKey) {
      return new NextResponse('Server configuration error', { status: 500 });
    }

    // Fetch the image server-side — the API key NEVER leaves the server.
    // Supports both:
    //   - Places API (New): photo_reference stored as "places/{id}/photos/{photoId}"
    //   - Legacy: old-style photo_reference strings
    const maxwidth = 1200;
    const photoRef = place.google_photo_reference;
    const isNewFormat = photoRef.startsWith('places/');

    const googleUrl = isNewFormat
      // Places API (New): GET /v1/{name}/media?maxWidthPx=...&skipHttpRedirect=true
      // Returns JSON { photoUri } — we then fetch the photoUri to get the image bytes
      ? `https://places.googleapis.com/v1/${photoRef}/media?maxWidthPx=${maxwidth}&skipHttpRedirect=true`
      // Legacy fallback
      : `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxwidth}&photoreference=${encodeURIComponent(photoRef)}&key=${encodeURIComponent(apiKey)}`;

    const fetchHeaders: Record<string, string> = isNewFormat
      ? { 'X-Goog-Api-Key': apiKey }
      : {};

    let imageRes: Response;
    if (isNewFormat) {
      // Step 1: get the signed photoUri
      const metaRes = await fetch(googleUrl, { headers: fetchHeaders });
      if (!metaRes.ok) {
        console.error(`Google Places photo meta fetch failed: ${metaRes.status}`);
        return new NextResponse('Photo unavailable', { status: 502 });
      }
      const meta = await metaRes.json() as { photoUri?: string };
      if (!meta.photoUri) {
        console.error('Google Places photo meta missing photoUri');
        return new NextResponse('Photo unavailable', { status: 502 });
      }
      // Step 2: fetch the actual image from the signed URI
      imageRes = await fetch(meta.photoUri, { redirect: 'follow' });
    } else {
      imageRes = await fetch(googleUrl, { redirect: 'follow' });
    }

    if (!imageRes.ok) {
      console.error(`Google Places photo fetch failed: ${imageRes.status}`);
      return new NextResponse('Photo unavailable', { status: 502 });
    }

    const contentType = imageRes.headers.get('content-type') ?? 'image/jpeg';
    const imageBuffer = await imageRes.arrayBuffer();

    // Return the image bytes with a private cache header.
    // private: prevents CDN/shared caches from storing it, but allows browser to cache locally.
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=3600',
        'Content-Length': imageBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error('Error serving place image:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
