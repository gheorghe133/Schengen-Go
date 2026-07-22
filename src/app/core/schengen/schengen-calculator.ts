import { addDays, fromEpochDay, toEpochDay } from './date-utils';
import { Trip } from './trip.model';

export const SCHENGEN_LIMIT_DAYS = 90;
export const SCHENGEN_WINDOW_DAYS = 180;

export interface SchengenStatus {
  referenceDate: string;
  usedDays: number;
  remainingDays: number;
  overstayDays: number;
}

export interface TripEvaluation {
  allowed: boolean;
  firstViolationDate: string | null;
  maxUsedDays: number;
}

export interface FutureComplianceCheck {
  willExceedLimit: boolean;
  violationDate: string | null;
  maxUsedDays: number;
}

/** Counts the distinct days covered by `trips` inside the 180-day window ending on `referenceDate`, inclusive. */
export function daysUsedInWindow(trips: Trip[], referenceDate: string): number {
  const windowEnd = toEpochDay(referenceDate);
  const windowStart = windowEnd - (SCHENGEN_WINDOW_DAYS - 1);

  const coveredDays = new Set<number>();
  for (const trip of trips) {
    const from = Math.max(toEpochDay(trip.entry), windowStart);
    const to = Math.min(toEpochDay(trip.exit), windowEnd);
    for (let day = from; day <= to; day++) {
      coveredDays.add(day);
    }
  }
  return coveredDays.size;
}

export function getStatus(trips: Trip[], referenceDate: string): SchengenStatus {
  const usedDays = daysUsedInWindow(trips, referenceDate);
  return {
    referenceDate,
    usedDays,
    remainingDays: Math.max(0, SCHENGEN_LIMIT_DAYS - usedDays),
    overstayDays: Math.max(0, usedDays - SCHENGEN_LIMIT_DAYS),
  };
}

/**
 * Checks whether a candidate trip can be taken on top of the existing trips without ever
 * exceeding the 90-day limit on any day from the candidate's entry onward — including days
 * that belong to already-planned future trips, which a new earlier candidate can just as
 * easily push over the limit (a day's window only looks backward, so days before the
 * candidate's entry can never be affected by it and don't need checking).
 */
export function canTakeTrip(
  trips: Trip[],
  candidate: { entry: string; exit: string },
): TripEvaluation {
  const combined: Trip[] = [...trips, { id: '__candidate__', ...candidate }];
  const entryDay = toEpochDay(candidate.entry);
  const lastAffectedDay = Math.max(...combined.map((trip) => toEpochDay(trip.exit)));

  let maxUsedDays = 0;
  let firstViolationDate: string | null = null;
  for (let day = entryDay; day <= lastAffectedDay; day++) {
    const dateIso = fromEpochDay(day);
    const usedDays = daysUsedInWindow(combined, dateIso);
    maxUsedDays = Math.max(maxUsedDays, usedDays);
    if (usedDays > SCHENGEN_LIMIT_DAYS && firstViolationDate === null) {
      firstViolationDate = dateIso;
    }
  }
  return { allowed: firstViolationDate === null, firstViolationDate, maxUsedDays };
}

/**
 * Longest uninterrupted stay starting on `startDate` that never exceeds the 90-day limit.
 * Bounded at 90 by construction: a single continuous stay past 90 days always violates the rule.
 */
export function maxConsecutiveStayFrom(trips: Trip[], startDate: string): number {
  let length = 0;
  for (let offset = 0; offset < SCHENGEN_LIMIT_DAYS; offset++) {
    const day = addDays(startDate, offset);
    const probe: Trip[] = [...trips, { id: '__probe__', entry: startDate, exit: day }];
    if (daysUsedInWindow(probe, day) > SCHENGEN_LIMIT_DAYS) break;
    length = offset + 1;
  }
  return length;
}

/** Whether `date` falls inside any trip (inclusive of entry and exit days). */
export function isDateCovered(trips: Trip[], date: string): boolean {
  const day = toEpochDay(date);
  return trips.some((trip) => toEpochDay(trip.entry) <= day && day <= toEpochDay(trip.exit));
}

/** Number of days a trip spans, inclusive of both the entry and exit day. */
export function tripDurationDays(trip: { entry: string; exit: string }): number {
  return toEpochDay(trip.exit) - toEpochDay(trip.entry) + 1;
}

/** Whether any part of a trip overlaps the 180-day window ending on `referenceDate`. */
export function isTripInWindow(
  trip: { entry: string; exit: string },
  referenceDate: string,
): boolean {
  const windowStart = addDays(referenceDate, -(SCHENGEN_WINDOW_DAYS - 1));
  return trip.exit >= windowStart && trip.entry <= referenceDate;
}

/** Whether a trip lies entirely before the window and can never affect the count again. */
export function isTripExpired(
  trip: { entry: string; exit: string },
  referenceDate: string,
): boolean {
  const windowStart = addDays(referenceDate, -(SCHENGEN_WINDOW_DAYS - 1));
  return trip.exit < windowStart;
}

/**
 * Scans every day from `referenceDate` through the last recorded trip's exit date to catch a
 * violation that today's own count doesn't show yet — e.g. two already-added trips that are each
 * fine on their own but, combined, will push a future day over the limit. Days before
 * `referenceDate` are skipped: today's count already reflects them via `getStatus`.
 */
export function checkFutureCompliance(trips: Trip[], referenceDate: string): FutureComplianceCheck {
  const startDay = toEpochDay(referenceDate);
  const lastDay = trips.length
    ? Math.max(...trips.map((trip) => toEpochDay(trip.exit)))
    : startDay - 1;

  let maxUsedDays = 0;
  let violationDate: string | null = null;
  for (let day = startDay; day <= lastDay; day++) {
    const dateIso = fromEpochDay(day);
    const usedDays = daysUsedInWindow(trips, dateIso);
    maxUsedDays = Math.max(maxUsedDays, usedDays);
    if (usedDays > SCHENGEN_LIMIT_DAYS && violationDate === null) {
      violationDate = dateIso;
    }
  }
  return { willExceedLimit: violationDate !== null, violationDate, maxUsedDays };
}

/** Earliest date on/after `fromDate` on which the existing trips leave at least one free day. */
export function nextAvailableEntryDate(
  trips: Trip[],
  fromDate: string,
  searchLimitDays = 366,
): string | null {
  for (let offset = 0; offset < searchLimitDays; offset++) {
    const day = addDays(fromDate, offset);
    if (daysUsedInWindow(trips, day) < SCHENGEN_LIMIT_DAYS) return day;
  }
  return null;
}
