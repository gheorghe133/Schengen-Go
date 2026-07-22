import type { Trip } from '@models/trip.model';

import { addDays } from '../date-utils';
import {
  canTakeTrip,
  checkFutureCompliance,
  daysUsedInWindow,
  getStatus,
  isDateCovered,
  isTripExpired,
  isTripInWindow,
  maxConsecutiveStayFrom,
  tripDurationDays,
} from './schengen-calculator';

function trip(id: string, entry: string, exit: string): Trip {
  return { id, entry, exit };
}

describe('daysUsedInWindow', () => {
  it('returns 0 when there are no trips', () => {
    expect(daysUsedInWindow([], '2024-06-30')).toBe(0);
  });

  it('counts a trip that lies entirely inside the window', () => {
    const referenceDate = '2024-06-30';
    const trips = [trip('t1', addDays(referenceDate, -50), addDays(referenceDate, -41))]; // 10 days
    expect(daysUsedInWindow(trips, referenceDate)).toBe(10);
  });

  it('excludes a trip that lies entirely before the window', () => {
    const referenceDate = '2024-06-30';
    const windowStart = addDays(referenceDate, -179);
    const trips = [trip('t1', addDays(windowStart, -30), addDays(windowStart, -20))];
    expect(daysUsedInWindow(trips, referenceDate)).toBe(0);
  });

  it('includes the exact first day of the window and excludes the day before it', () => {
    const referenceDate = '2024-06-30';
    const windowStart = addDays(referenceDate, -179);
    const dayBeforeWindow = addDays(windowStart, -1);

    expect(daysUsedInWindow([trip('t1', windowStart, windowStart)], referenceDate)).toBe(1);
    expect(daysUsedInWindow([trip('t2', dayBeforeWindow, dayBeforeWindow)], referenceDate)).toBe(0);
  });

  it('clips a trip that starts before the window and ends inside it', () => {
    const referenceDate = '2024-06-30';
    const windowStart = addDays(referenceDate, -179);
    const trips = [trip('t1', addDays(windowStart, -10), addDays(windowStart, 5))];
    expect(daysUsedInWindow(trips, referenceDate)).toBe(6);
  });

  it('does not double-count overlapping trips', () => {
    const trips = [trip('t1', '2024-01-01', '2024-01-10'), trip('t2', '2024-01-05', '2024-01-15')];
    expect(daysUsedInWindow(trips, '2024-01-15')).toBe(15);
  });
});

describe('getStatus', () => {
  it('reports full 90 days remaining with no trips', () => {
    expect(getStatus([], '2024-06-30')).toEqual({
      referenceDate: '2024-06-30',
      usedDays: 0,
      remainingDays: 90,
      overstayDays: 0,
    });
  });

  it('reports an overstay when used days exceed 90', () => {
    const referenceDate = '2024-06-30';
    const trips = [trip('t1', addDays(referenceDate, -94), referenceDate)];
    const status = getStatus(trips, referenceDate);
    expect(status.usedDays).toBe(95);
    expect(status.remainingDays).toBe(0);
    expect(status.overstayDays).toBe(5);
  });
});

describe('canTakeTrip', () => {
  it('allows a 90-day trip when there are no other trips', () => {
    const entry = '2024-01-01';
    const exit = addDays(entry, 89);
    const result = canTakeTrip([], { entry, exit });
    expect(result.allowed).toBe(true);
    expect(result.maxUsedDays).toBe(90);
  });

  it('rejects a 91-day trip and flags the day it goes over', () => {
    const entry = '2024-01-01';
    const exit = addDays(entry, 90);
    const result = canTakeTrip([], { entry, exit });
    expect(result.allowed).toBe(false);
    expect(result.maxUsedDays).toBe(91);
    expect(result.firstViolationDate).toBe(exit);
  });

  it('accounts for existing trips still inside the window', () => {
    const existing = [trip('t1', '2024-01-01', '2024-01-30')]; // 30 days
    const candidateEntry = '2024-02-01';
    const candidateExit = addDays(candidateEntry, 65); // 66-day candidate trip
    const result = canTakeTrip(existing, { entry: candidateEntry, exit: candidateExit });

    expect(result.allowed).toBe(false);
    expect(result.maxUsedDays).toBe(96); // 30 existing + 66 candidate
    expect(result.firstViolationDate).toBe(addDays(candidateEntry, 60));
  });

  it('flags a violation that only shows up on an already-planned future trip', () => {
    // A trip already booked for later — compliant on its own.
    const planned = [trip('planned', '2024-08-01', '2024-08-10')]; // 10 days
    const candidateEntry = '2024-05-01';
    const candidateExit = addDays(candidateEntry, 84); // 85-day candidate, also compliant on its own

    const result = canTakeTrip(planned, { entry: candidateEntry, exit: candidateExit });

    expect(result.allowed).toBe(false);
    expect(result.maxUsedDays).toBe(95); // 85 (candidate) + 10 (already-planned trip)
    // the violation shows up during the *already-planned* trip, not within the candidate's own dates
    expect(result.firstViolationDate).toBe(addDays('2024-08-01', 5));
  });

  it('ignores an already-planned trip that is more than 180 days away from the candidate', () => {
    const planned = [trip('planned', '2024-08-01', '2024-08-10')]; // 10 days
    const candidateEntry = '2025-05-01'; // about a year later — well outside any shared window
    const candidateExit = addDays(candidateEntry, 84); // 85-day candidate, compliant on its own

    const result = canTakeTrip(planned, { entry: candidateEntry, exit: candidateExit });

    expect(result.allowed).toBe(true);
    expect(result.maxUsedDays).toBe(85);
  });
});

describe('maxConsecutiveStayFrom', () => {
  it('is 90 when there are no other trips', () => {
    expect(maxConsecutiveStayFrom([], '2024-01-01')).toBe(90);
  });

  it('is reduced by days already used inside the window', () => {
    const startDate = '2024-06-01';
    const existing = [trip('t1', addDays(startDate, -40), addDays(startDate, -11))]; // 30 days
    expect(maxConsecutiveStayFrom(existing, startDate)).toBe(60);
  });
});

describe('isDateCovered', () => {
  it('is true for the entry and exit days and every day between', () => {
    const trips = [trip('t1', '2024-03-05', '2024-03-08')];
    expect(isDateCovered(trips, '2024-03-05')).toBe(true);
    expect(isDateCovered(trips, '2024-03-06')).toBe(true);
    expect(isDateCovered(trips, '2024-03-08')).toBe(true);
  });

  it('is false for days outside every trip', () => {
    const trips = [trip('t1', '2024-03-05', '2024-03-08')];
    expect(isDateCovered(trips, '2024-03-04')).toBe(false);
    expect(isDateCovered(trips, '2024-03-09')).toBe(false);
  });
});

describe('tripDurationDays', () => {
  it('counts both the entry and exit day', () => {
    expect(tripDurationDays({ entry: '2024-01-01', exit: '2024-01-01' })).toBe(1);
    expect(tripDurationDays({ entry: '2024-01-01', exit: '2024-01-10' })).toBe(10);
  });
});

describe('isTripInWindow', () => {
  it('is true for a trip fully inside the window', () => {
    const referenceDate = '2024-06-30';
    expect(isTripInWindow({ entry: '2024-06-01', exit: '2024-06-10' }, referenceDate)).toBe(true);
  });

  it('is true for a trip that only partially overlaps the window', () => {
    const referenceDate = '2024-06-30';
    const windowStart = addDays(referenceDate, -179);
    expect(
      isTripInWindow({ entry: addDays(windowStart, -5), exit: windowStart }, referenceDate),
    ).toBe(true);
  });

  it('is false for a trip entirely before the window', () => {
    const referenceDate = '2024-06-30';
    const windowStart = addDays(referenceDate, -179);
    const dayBeforeWindow = addDays(windowStart, -1);
    expect(
      isTripInWindow({ entry: addDays(dayBeforeWindow, -5), exit: dayBeforeWindow }, referenceDate),
    ).toBe(false);
  });

  it('is false for a trip entirely after the reference date', () => {
    const referenceDate = '2024-06-30';
    expect(isTripInWindow({ entry: '2024-07-01', exit: '2024-07-10' }, referenceDate)).toBe(false);
  });
});

describe('checkFutureCompliance', () => {
  it('reports no violation when there are no trips', () => {
    expect(checkFutureCompliance([], '2024-06-30')).toEqual({
      willExceedLimit: false,
      violationDate: null,
      maxUsedDays: 0,
    });
  });

  it('catches two already-added trips that are each fine alone but violate together, even though today is still compliant', () => {
    // "Today" sits inside the first trip, so its own count so far is under 90 — the second,
    // fully future trip is what tips it over, and that only shows up by scanning forward.
    const today = '2026-07-22';
    const trips = [
      trip('a', '2026-05-01', '2026-07-24'), // 85 days, spans across "today"
      trip('b', '2026-08-01', '2026-08-10'), // 10 days, entirely in the future
    ];

    const todayStatus = getStatus(trips, today);
    expect(todayStatus.overstayDays).toBe(0); // not flagged yet by today's own count

    const futureCheck = checkFutureCompliance(trips, today);
    expect(futureCheck.willExceedLimit).toBe(true);
    expect(futureCheck.maxUsedDays).toBe(95);
    expect(futureCheck.violationDate).toBe(addDays('2026-08-01', 5));
  });

  it('reports no violation when planned trips stay within the limit', () => {
    const today = '2026-07-22';
    const trips = [trip('a', '2026-08-01', '2026-08-10')];
    expect(checkFutureCompliance(trips, today)).toEqual({
      willExceedLimit: false,
      violationDate: null,
      maxUsedDays: 10,
    });
  });
});

describe('isTripExpired', () => {
  it('is false for a trip still inside the window', () => {
    const referenceDate = '2024-06-30';
    expect(isTripExpired({ entry: '2024-06-01', exit: '2024-06-10' }, referenceDate)).toBe(false);
  });

  it('is false for a trip that has not started yet', () => {
    const referenceDate = '2024-06-30';
    expect(isTripExpired({ entry: '2024-07-01', exit: '2024-07-10' }, referenceDate)).toBe(false);
  });

  it('is true for a trip entirely before the window', () => {
    const referenceDate = '2024-06-30';
    const windowStart = addDays(referenceDate, -179);
    const dayBeforeWindow = addDays(windowStart, -1);
    expect(
      isTripExpired({ entry: addDays(dayBeforeWindow, -5), exit: dayBeforeWindow }, referenceDate),
    ).toBe(true);
  });
});
