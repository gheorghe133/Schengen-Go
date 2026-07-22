import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { validateDateRange } from '../../core/schengen/date-utils';
import {
  canTakeTrip,
  maxConsecutiveStayFrom,
  TripEvaluation,
} from '../../core/schengen/schengen-calculator';
import { TripsStore } from '../../core/schengen/trips.store';

@Component({
  selector: 'app-simulate',
  imports: [FormsModule],
  templateUrl: './simulate.html',
})
export class Simulate {
  private readonly store = inject(TripsStore);

  entry = '';
  exit = '';
  error: string | null = null;
  result: TripEvaluation | null = null;
  maxStayIfStartingHere: number | null = null;
  violationHitsPlannedTrip = false;

  check(): void {
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
}
