export interface SchengenCountry {
  code: string;
  name: string;
}

/** The 29 Schengen Area member states, sorted by Romanian name for display in a dropdown. */
export const SCHENGEN_COUNTRIES: SchengenCountry[] = [
  { code: 'AT', name: 'Austria' },
  { code: 'BE', name: 'Belgia' },
  { code: 'BG', name: 'Bulgaria' },
  { code: 'CH', name: 'Elveția' },
  { code: 'CZ', name: 'Cehia' },
  { code: 'DE', name: 'Germania' },
  { code: 'DK', name: 'Danemarca' },
  { code: 'EE', name: 'Estonia' },
  { code: 'ES', name: 'Spania' },
  { code: 'FI', name: 'Finlanda' },
  { code: 'FR', name: 'Franța' },
  { code: 'GR', name: 'Grecia' },
  { code: 'HR', name: 'Croația' },
  { code: 'HU', name: 'Ungaria' },
  { code: 'IS', name: 'Islanda' },
  { code: 'IT', name: 'Italia' },
  { code: 'LI', name: 'Liechtenstein' },
  { code: 'LT', name: 'Lituania' },
  { code: 'LU', name: 'Luxemburg' },
  { code: 'LV', name: 'Letonia' },
  { code: 'MT', name: 'Malta' },
  { code: 'NL', name: 'Țările de Jos' },
  { code: 'NO', name: 'Norvegia' },
  { code: 'PL', name: 'Polonia' },
  { code: 'PT', name: 'Portugalia' },
  { code: 'RO', name: 'România' },
  { code: 'SE', name: 'Suedia' },
  { code: 'SI', name: 'Slovenia' },
  { code: 'SK', name: 'Slovacia' },
].sort((a, b) => a.name.localeCompare(b.name, 'ro'));

const NAME_BY_CODE = new Map(SCHENGEN_COUNTRIES.map((country) => [country.code, country.name]));

export function schengenCountryName(code: string): string | undefined {
  return NAME_BY_CODE.get(code);
}
