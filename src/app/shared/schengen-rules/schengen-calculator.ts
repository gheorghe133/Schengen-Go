import type {
  FutureComplianceCheck,
  SchengenStatus,
  TripEvaluation,
} from '@models/schengen-status.model';
import type { Trip } from '@models/trip.model';

import { addDays, fromEpochDay, toEpochDay } from '../date-utils';
import { SCHENGEN_LIMIT_DAYS, SCHENGEN_WINDOW_DAYS } from './schengen.constants';

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
 * Checks every day from the candidate's entry through the latest exit date among all trips,
 * including already-planned future ones — a new earlier candidate can push an existing future
 * trip over the limit even when both are compliant on their own.
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

export function isDateCovered(trips: Trip[], date: string): boolean {
  const day = toEpochDay(date);
  return trips.some((trip) => toEpochDay(trip.entry) <= day && day <= toEpochDay(trip.exit));
}

export function tripDurationDays(trip: { entry: string; exit: string }): number {
  return toEpochDay(trip.exit) - toEpochDay(trip.entry) + 1;
}

export function isTripInWindow(
  trip: { entry: string; exit: string },
  referenceDate: string,
): boolean {
  const windowStart = addDays(referenceDate, -(SCHENGEN_WINDOW_DAYS - 1));
  return trip.exit >= windowStart && trip.entry <= referenceDate;
}

export function isTripExpired(
  trip: { entry: string; exit: string },
  referenceDate: string,
): boolean {
  const windowStart = addDays(referenceDate, -(SCHENGEN_WINDOW_DAYS - 1));
  return trip.exit < windowStart;
}

/**
 * Scans forward from `referenceDate` to catch a violation today's own count doesn't show yet —
 * e.g. two already-added trips that are each fine alone but, combined, exceed the limit later.
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
