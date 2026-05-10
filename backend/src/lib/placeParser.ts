// src/lib/placeParser.ts

export type ParsedPlace = {
  kind: 'placeId' | 'coords' | 'short' | 'unknown';
  googlePlaceId?: string;
  name?: string;
  lat?: number;
  lng?: number;
  raw: string;
};

/**
 * Parse a Google Maps URL or Place ID string into a structured ParsedPlace.
 */
export function parseGoogleMapsUrl(input: string): ParsedPlace {
  const raw = input.trim();

  // 1. Bare Place ID: starts with ChIJ
  if (/^ChIJ[\w-]+$/.test(raw)) {
    return { kind: 'placeId', googlePlaceId: raw, raw };
  }

  // 2. URL containing place_id= query param
  const placeIdParam = raw.match(/[?&]place_id=(ChIJ[\w-]+)/);
  if (placeIdParam) {
    return { kind: 'placeId', googlePlaceId: placeIdParam[1], raw };
  }

  // 3. URL containing data=...!1s<PlaceId> pattern (encoded in maps URLs)
  const dataPattern = raw.match(/!1s(ChIJ[\w-]+)/);
  if (dataPattern) {
    return { kind: 'placeId', googlePlaceId: dataPattern[1], raw };
  }

  // 4. Short link (maps.app.goo.gl) — cannot resolve without HTTP
  if (/https?:\/\/maps\.app\.goo\.gl\//.test(raw)) {
    return { kind: 'short', raw };
  }

  // 5. Full maps URL: https://www.google.com/maps/place/<name>/@<lat>,<lng>,...
  const fullMapsMatch = raw.match(
    /https?:\/\/(?:www\.)?google\.com\/maps\/place\/([^/@]+)\/@(-?\d+\.?\d*),(-?\d+\.?\d*)/
  );
  if (fullMapsMatch) {
    const encodedName = fullMapsMatch[1];
    // Replace + with space then decode URI components
    const name = decodeURIComponent(encodedName.replace(/\+/g, ' '));
    const lat = parseFloat(fullMapsMatch[2]);
    const lng = parseFloat(fullMapsMatch[3]);
    return { kind: 'coords', name, lat, lng, raw };
  }

  // 6. Unknown
  return { kind: 'unknown', raw };
}

/**
 * Compute a stable deduplication key for a place.
 */
export function dedupeKey(input: {
  googlePlaceId?: string | null;
  name: string;
  lat?: number | null;
  lng?: number | null;
}): string {
  if (input.googlePlaceId) {
    return `gpid:${input.googlePlaceId}`;
  }
  const normalizedName = input.name.trim().toLowerCase().replace(/\s+/g, ' ');
  const coords =
    input.lat != null && input.lng != null
      ? `${input.lat.toFixed(3)},${input.lng.toFixed(3)}`
      : 'noll';
  return `n:${normalizedName}|${coords}`;
}
