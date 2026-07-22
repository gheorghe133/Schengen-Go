import { Component, computed, inject, signal } from '@angular/core';
import { TripsStore } from '@core/trips.store';
import type { MonthDay } from '@models/calendar.model';
import { addDays, buildMonthGrid } from '@shared/date-utils';
import { isDateCovered } from '@shared/schengen-rules/schengen-calculator';

const MONTH_NAMES = [
  'Ianuarie',
  'Februarie',
  'Martie',
  'Aprilie',
  'Mai',
  'Iunie',
  'Iulie',
  'August',
  'Septembrie',
  'Octombrie',
  'Noiembrie',
  'Decembrie',
];

type DayStatus = 'used' | 'other-covered' | 'plain';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.html',
})
export class Calendar {
  private readonly store = inject(TripsStore);

  protected readonly weekdayLabels = ['L', 'Ma', 'Mi', 'J', 'V', 'S', 'D'];

  protected readonly viewYear = signal(Number(this.store.today().slice(0, 4)));
  protected readonly viewMonth = signal(Number(this.store.today().slice(5, 7)) - 1);

  protected readonly monthLabel = computed(
    () => `${MONTH_NAMES[this.viewMonth()]} ${this.viewYear()}`,
  );

  protected readonly weeks = computed<MonthDay[][]>(() => {
    const grid = buildMonthGrid(this.viewYear(), this.viewMonth());
    return Array.from({ length: grid.length / 7 }, (_, i) => grid.slice(i * 7, i * 7 + 7));
  });

  private readonly windowStart = computed(() => addDays(this.store.today(), -179));

  protected previousMonth(): void {
    if (this.viewMonth() === 0) {
      this.viewYear.update((year) => year - 1);
      this.viewMonth.set(11);
    } else {
      this.viewMonth.update((month) => month - 1);
    }
  }

  protected nextMonth(): void {
    if (this.viewMonth() === 11) {
      this.viewYear.update((year) => year + 1);
      this.viewMonth.set(0);
    } else {
      this.viewMonth.update((month) => month + 1);
    }
  }

  protected dayStatus(date: string): DayStatus {
    if (!isDateCovered(this.store.trips(), date)) return 'plain';
    const inWindow = date >= this.windowStart() && date <= this.store.today();
    return inWindow ? 'used' : 'other-covered';
  }

  protected isToday(date: string): boolean {
    return date === this.store.today();
  }

  protected dayNumber(date: string): number {
    return Number(date.slice(8, 10));
  }
}
