import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TripsStore } from '@core/trips.store';
import type { TripEvaluation } from '@models/schengen-status.model';
import { validateDateRange } from '@shared/date-utils';
import { canTakeTrip, maxConsecutiveStayFrom } from '@shared/schengen-rules/schengen-calculator';

@Component({
  selector: 'app-simulate',
  imports: [FormsModule],
  templateUrl: './simulate.html',
})
export class Simulate {
  private readonly store = inject(TripsStore);

  protected entry = '';
  protected exit = '';
  protected error: string | null = null;
  protected result: TripEvaluation | null = null;
  protected maxStayIfStartingHere: number | null = null;
  protected violationHitsPlannedTrip = false;

  protected check(): void {
    this.result = null;
    this.maxStayIfStartingHere = null;
    this.violationHitsPlannedTrip = false;

    this.error = validateDateRange(this.entry, this.exit);
    if (this.error) return;

    this.result = canTakeTrip(this.store.trips(), { entry: this.entry, exit: this.exit });
    if (!this.result.allowed) {
      this.maxStayIfStartingHere = maxConsecutiveStayFrom(this.store.trips(), this.entry);
      this.violationHitsPlannedTrip = (this.result.firstViolationDate ?? '') > this.exit;
    }
  }

  protected reset(): void {
    this.entry = '';
    this.exit = '';
    this.error = null;
    this.result = null;
    this.maxStayIfStartingHere = null;
    this.violationHitsPlannedTrip = false;
  }
}
