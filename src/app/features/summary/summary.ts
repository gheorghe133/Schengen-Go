import { Component, computed, inject } from '@angular/core';
import { TripsStore } from '@core/trips.store';
import { SCHENGEN_LIMIT_DAYS } from '@shared/schengen-rules/schengen.constants';
import { checkFutureCompliance } from '@shared/schengen-rules/schengen-calculator';

const NEAR_LIMIT_THRESHOLD_DAYS = 10;

@Component({
  selector: 'app-summary',
  templateUrl: './summary.html',
})
export class Summary {
  protected readonly store = inject(TripsStore);

  protected readonly progressPercent = computed(() =>
    Math.min(100, (this.store.status().usedDays / SCHENGEN_LIMIT_DAYS) * 100),
  );

  protected readonly isNearLimit = computed(() => {
    const status = this.store.status();
    return status.overstayDays === 0 && status.remainingDays <= NEAR_LIMIT_THRESHOLD_DAYS;
  });

  protected readonly futureRisk = computed(() =>
    checkFutureCompliance(this.store.trips(), this.store.today()),
  );
}
