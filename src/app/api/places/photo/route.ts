import { NextResponse } from 'next/server';
import { getGooglePlacesApiKey } from '@/lib/maps/googlePlaces';

function isGooglePhotoName(value: string): boolean {
  const parts = value.split('/');
  return parts.length === 4
    && parts[0] === 'places'
    && parts[2] === 'photos'
    && /^[A-Za-z0-9_-]+$/.test(parts[1])
    && /^[A-Za-z0-9_-]+$/.test(parts[3]);
}

export async function GET(request: Request) {
  const photoName = new URL(request.url).searchParams.get('name');
  if (!photoName || !isGooglePhotoName(photoName)) {
    return new NextResponse('Invalid photo reference', { status: 400 });
  }

  const apiKey = getGooglePlacesApiKey();
  if (!apiKey) {
    return new NextResponse('Photo service unavailable', { status: 503 });
  }

  try {
    const mediaUrl = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=800&skipHttpRedirect=true`;
    const response = await fetch(mediaUrl, {
      headers: { 'X-Goog-Api-Key': apiKey },
      cache: 'no-store',
    });

    if (!response.ok) {
      return new NextResponse('Photo unavailable', { status: 502 });
    }

    const { photoUri } = await response.json() as { photoUri?: string };
    if (!photoUri) {
      return new NextResponse('Photo unavailable', { status: 502 });
    }

    const photoUrl = new URL(photoUri);
    const isGooglePhotoHost = photoUrl.hostname === 'googleusercontent.com'
      || photoUrl.hostname.endsWith('.googleusercontent.com');
    if (photoUrl.protocol !== 'https:' || !isGooglePhotoHost) {
      return new NextResponse('Photo unavailable', { status: 502 });
    }

    return NextResponse.redirect(photoUrl, {
      headers: { 'Cache-Control': 'private, max-age=300' },
    });
  } catch {
    return new NextResponse('Photo unavailable', { status: 502 });
  }
}