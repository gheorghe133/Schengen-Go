export interface MonthDay {
  date: string;
  /** false for the leading/trailing days from adjacent months used to fill out full weeks */
  inMonth: boolean;
}
