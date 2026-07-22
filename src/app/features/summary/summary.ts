import { Component, computed, inject } from '@angular/core';
import { checkFutureCompliance } from '../../core/schengen/schengen-calculator';
import { TripsStore } from '../../core/schengen/trips.store';

const NEAR_LIMIT_THRESHOLD_DAYS = 10;

@Component({
  selector: 'app-summary',
  templateUrl: './summary.html',
})
export class Summary {
  protected readonly store = inject(TripsStore);

  protected readonly progressPercent = computed(() =>
    Math.min(100, (this.store.status().usedDays / 90) * 100),
  );

  protected readonly isNearLimit = computed(() => {
    const status = this.store.status();
    return status.overstayDays === 0 && status.remainingDays <= NEAR_LIMIT_THRESHOLD_DAYS;
  });

  /** Catches a violation baked into already-added trips that today's own count doesn't show yet. */
  protected readonly futureRisk = computed(() =>
    checkFutureCompliance(this.store.trips(), this.store.today()),
  );
}
