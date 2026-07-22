import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TripsStore } from '@core/trips.store';
import { validateDateRange } from '@shared/date-utils';
import { SCHENGEN_COUNTRIES } from '@shared/schengen-rules/schengen-countries';

@Component({
  selector: 'app-trip-form',
  imports: [FormsModule],
  templateUrl: './trip-form.html',
})
export class TripForm {
  private readonly store = inject(TripsStore);

  protected readonly countries = SCHENGEN_COUNTRIES;

  protected entry = '';
  protected exit = '';
  protected countryCode = '';
  protected error: string | null = null;

  protected submit(): void {
    this.error =
      validateDateRange(this.entry, this.exit) ?? (this.countryCode ? null : 'Selectează țara.');
    if (this.error) return;

    // Reset immediately — Firestore already reflects the write optimistically via the
    // trips() signal before the server acknowledges it, so the form shouldn't wait on
    // that round trip. If the write does fail, put the values back and show why.
    const entry = this.entry;
    const exit = this.exit;
    const countryCode = this.countryCode;
    this.entry = '';
    this.exit = '';
    this.countryCode = '';

    this.store.addTrip(entry, exit, countryCode).catch(() => {
      this.entry = entry;
      this.exit = exit;
      this.countryCode = countryCode;
      this.error = 'Nu am putut salva călătoria. Încearcă din nou.';
    });
  }
}
