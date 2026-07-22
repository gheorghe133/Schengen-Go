export interface Trip {
  id: string;
  /** ISO date 'YYYY-MM-DD', inclusive */
  entry: string;
  /** ISO date 'YYYY-MM-DD', inclusive */
  exit: string;
  /** A SCHENGEN_COUNTRIES code. Optional only because trips saved before this field existed lack it. */
  countryCode?: string;
}
