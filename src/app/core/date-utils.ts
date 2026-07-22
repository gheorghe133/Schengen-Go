import { MonthDay } from '../models/calendar.model';

/** All dates are ISO strings ('YYYY-MM-DD') and are handled as whole UTC days to avoid timezone drift. */

const MS_PER_DAY = 86_400_000;

export function toEpochDay(iso: string): number {
  const [year, month, day] = iso.split('-').map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / MS_PER_DAY);
}

export function fromEpochDay(epochDay: number): string {
  return new Date(epochDay * MS_PER_DAY).toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  return fromEpochDay(toEpochDay(iso) + days);
}

export function validateDateRange(entry: string, exit: string): string | null {
  if (!entry || !exit) return 'Completează ambele date.';
  if (entry > exit) return 'Data de intrare trebuie să fie înainte de data de ieșire.';
  return null;
}

/** A Monday-first grid of full weeks covering `monthIndex0` (0 = January). */
export function buildMonthGrid(year: number, monthIndex0: number): MonthDay[] {
  const firstOfMonthEpoch = toEpochDay(`${year}-${String(monthIndex0 + 1).padStart(2, '0')}-01`);
  const firstWeekday = (new Date(firstOfMonthEpoch * MS_PER_DAY).getUTCDay() + 6) % 7; // Mon=0..Sun=6
  const daysInMonth = new Date(Date.UTC(year, monthIndex0 + 1, 0)).getUTCDate();
  const totalCells = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;
  const startEpoch = firstOfMonthEpoch - firstWeekday;

  return Array.from({ length: totalCells }, (_, i) => {
    const epoch = startEpoch + i;
    return {
      date: fromEpochDay(epoch),
      inMonth: epoch >= firstOfMonthEpoch && epoch < firstOfMonthEpoch + daysInMonth,
    };
  });
}
