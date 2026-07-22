import { Component, computed, inject } from '@angular/core';

import {
  isTripExpired,
  isTripInWindow,
  tripDurationDays,
} from '../../core/schengen/schengen-calculator';
import { schengenCountryName } from '../../core/schengen/schengen-countries';
import { Trip } from '../../core/schengen/trip.model';
import { TripsStore } from '../../core/schengen/trips.store';

type TripStatus = 'in-window' | 'expired' | 'upcoming';

@Component({
  selector: 'app-trip-list',
  templateUrl: './trip-list.html',
})
export class TripList {
  protected readonly store = inject(TripsStore);
  protected error: string | null = null;

  protected readonly expiredCount = computed(
    () => this.store.trips().filter((trip) => isTripExpired(trip, this.store.today())).length,
  );

  protected duration(trip: Trip): number {
    return tripDurationDays(trip);
  }

  protected countryName(trip: Trip): string | undefined {
    return trip.countryCode ? schengenCountryName(trip.countryCode) : undefined;
  }

  protected status(trip: Trip): TripStatus {
    const today = this.store.today();
    if (isTripInWindow(trip, today)) return 'in-window';
    return isTripExpired(trip, today) ? 'expired' : 'upcoming';
  }

  protected async removeTrip(id: string): Promise<void> {
    this.error = null;
    try {
      await this.store.removeTrip(id);
    } catch {
      this.error = 'Nu am putut șterge călătoria. Încearcă din nou.';
    }
  }

  protected async clearExpiredTrips(): Promise<void> {
    this.error = null;
    const today = this.store.today();
    const ids = new Set(
      this.store
        .trips()
        .filter((trip) => isTripExpired(trip, today))
        .map((trip) => trip.id),
    );
    try {
      await this.store.removeTrips(ids);
    } catch {
      this.error = 'Nu am putut șterge călătoriile expirate. Încearcă din nou.';
    }
  }
}
