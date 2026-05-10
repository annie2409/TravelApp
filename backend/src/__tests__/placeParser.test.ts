// src/__tests__/placeParser.test.ts
import { parseGoogleMapsUrl, dedupeKey } from '../lib/placeParser';

describe('parseGoogleMapsUrl', () => {
  it('recognises a bare ChIJ Place ID', () => {
    const result = parseGoogleMapsUrl('ChIJN1t_tDeuEmsRUsoyG83frY4');
    expect(result.kind).toBe('placeId');
    expect(result.googlePlaceId).toBe('ChIJN1t_tDeuEmsRUsoyG83frY4');
    expect(result.raw).toBe('ChIJN1t_tDeuEmsRUsoyG83frY4');
  });

  it('extracts Place ID from place_id= query param', () => {
    const url = 'https://www.google.com/maps/search/?api=1&place_id=ChIJN1t_tDeuEmsRUsoyG83frY4';
    const result = parseGoogleMapsUrl(url);
    expect(result.kind).toBe('placeId');
    expect(result.googlePlaceId).toBe('ChIJN1t_tDeuEmsRUsoyG83frY4');
  });

  it('extracts Place ID from !1s data pattern', () => {
    const url =
      'https://www.google.com/maps/place/Opera+House/@-33.8567844,151.2152967,15z/data=!4m2!3m1!1sChIJ3S-JXmauEmsRUcIaWtf4MzE';
    const result = parseGoogleMapsUrl(url);
    expect(result.kind).toBe('placeId');
    expect(result.googlePlaceId).toBe('ChIJ3S-JXmauEmsRUcIaWtf4MzE');
  });

  it('extracts name, lat, lng from a full maps place URL', () => {
    const url =
      'https://www.google.com/maps/place/Eiffel+Tower/@48.8583701,2.2944813,17z';
    const result = parseGoogleMapsUrl(url);
    expect(result.kind).toBe('coords');
    expect(result.name).toBe('Eiffel Tower');
    expect(result.lat).toBeCloseTo(48.8583701);
    expect(result.lng).toBeCloseTo(2.2944813);
  });

  it('returns short for a maps.app.goo.gl link', () => {
    const result = parseGoogleMapsUrl('https://maps.app.goo.gl/abc123XYZ');
    expect(result.kind).toBe('short');
    expect(result.raw).toBe('https://maps.app.goo.gl/abc123XYZ');
  });

  it('returns unknown for unrecognised input', () => {
    const result = parseGoogleMapsUrl('https://example.com/some-place');
    expect(result.kind).toBe('unknown');
  });

  it('trims whitespace before parsing', () => {
    const result = parseGoogleMapsUrl('  ChIJN1t_tDeuEmsRUsoyG83frY4  ');
    expect(result.kind).toBe('placeId');
    expect(result.googlePlaceId).toBe('ChIJN1t_tDeuEmsRUsoyG83frY4');
  });
});

describe('dedupeKey', () => {
  it('uses gpid prefix when googlePlaceId is present', () => {
    const key = dedupeKey({ googlePlaceId: 'ChIJN1t_tDeuEmsRUsoyG83frY4', name: 'Somewhere' });
    expect(key).toBe('gpid:ChIJN1t_tDeuEmsRUsoyG83frY4');
  });

  it('builds name+coords key when no googlePlaceId', () => {
    const key = dedupeKey({ name: 'Eiffel Tower', lat: 48.8583701, lng: 2.2944813 });
    expect(key).toBe('n:eiffel tower|48.858,2.294');
  });

  it('uses noll when coords are missing', () => {
    const key = dedupeKey({ name: 'Mystery Place' });
    expect(key).toBe('n:mystery place|noll');
  });

  it('normalises extra spaces in name', () => {
    const key = dedupeKey({ name: '  Eiffel   Tower  ' });
    expect(key).toBe('n:eiffel tower|noll');
  });

  it('ignores googlePlaceId when null', () => {
    const key = dedupeKey({ googlePlaceId: null, name: 'Test', lat: 1.0, lng: 2.0 });
    expect(key).toBe('n:test|1.000,2.000');
  });
});
