import { SCHENGEN_COUNTRIES, schengenCountryName } from './schengen-countries';

describe('SCHENGEN_COUNTRIES', () => {
  it('lists exactly the 29 Schengen Area member states, with no duplicates', () => {
    expect(SCHENGEN_COUNTRIES).toHaveLength(29);
    const codes = new Set(SCHENGEN_COUNTRIES.map((c) => c.code));
    expect(codes.size).toBe(29);
  });

  it('excludes non-Schengen countries', () => {
    const codes = new Set(SCHENGEN_COUNTRIES.map((c) => c.code));
    expect(codes.has('GB')).toBe(false); // United Kingdom
    expect(codes.has('IE')).toBe(false); // Ireland
    expect(codes.has('CY')).toBe(false); // Cyprus
  });
});

describe('schengenCountryName', () => {
  it('resolves a known code to its Romanian name', () => {
    expect(schengenCountryName('RO')).toBe('România');
    expect(schengenCountryName('FR')).toBe('Franța');
  });

  it('returns undefined for an unknown code', () => {
    expect(schengenCountryName('XX')).toBeUndefined();
  });
});
