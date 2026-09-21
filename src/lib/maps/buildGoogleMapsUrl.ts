export function buildGoogleMapsUrl(
  name: string,
  googleMapsQuery?: string | null,
  area?: string | null
): string {
  // Prefer the persisted query string (AI-generated, verified at time of creation)
  // Fall back to building from name + area
  const q = googleMapsQuery?.trim() || [name, area, '東京'].filter(Boolean).join(' ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}
