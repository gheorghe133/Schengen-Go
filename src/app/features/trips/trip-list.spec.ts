import { TestBed } from '@angular/core/testing';
import { TripsStore } from '@core/trips.store';
import type { Trip } from '@models/trip.model';

import { TripList } from './trip-list';

const TODAY = '2024-06-30';
const EXPIRED: Trip = { id: 'expired', entry: '2023-06-01', exit: '2023-06-10' };
const IN_WINDOW: Trip = {
  id: 'in-window',
  entry: '2024-06-01',
  exit: '2024-06-10',
  countryCode: 'FR',
};
const UPCOMING: Trip = { id: 'upcoming', entry: '2024-08-01', exit: '2024-08-10' };

async function createFixture(trips: Trip[], removeTrip = vi.fn(), removeTrips = vi.fn()) {
  TestBed.configureTestingModule({
    imports: [TripList],
    providers: [
      {
        provide: TripsStore,
        useValue: {
          sortedTrips: () => trips,
          trips: () => trips,
          today: () => TODAY,
          removeTrip,
          removeTrips,
        },
      },
    ],
  });
  const fixture = TestBed.createComponent(TripList);
  await fixture.whenStable();
  return fixture;
}

describe('TripList', () => {
  it('shows a placeholder message when there are no trips', async () => {
    const fixture = await createFixture([]);
    expect(fixture.nativeElement.textContent).toContain('Nu ai adăugat încă nicio călătorie.');
  });

  it('renders each trip with its duration, country and status', async () => {
    const fixture = await createFixture([EXPIRED, IN_WINDOW, UPCOMING]);
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('2024-06-01 → 2024-06-10');
    expect(text).toContain('10 zile');
    expect(text).toContain('Franța');
    expect(text).toContain('expirată, nu mai contează');
    expect(text).toContain('planificată');
  });

  it('deletes a single trip when its delete button is clicked', async () => {
    const removeTrip = vi.fn();
    const fixture = await createFixture([IN_WINDOW], removeTrip);

    fixture.nativeElement.querySelector('button[aria-label*="Șterge"]').click();
    await fixture.whenStable();

    expect(removeTrip).toHaveBeenCalledWith('in-window');
  });

  it('bulk-clears only expired trips, leaving planned trips untouched', async () => {
    const removeTrips = vi.fn();
    const fixture = await createFixture([EXPIRED, IN_WINDOW, UPCOMING], vi.fn(), removeTrips);

    const clearButton: HTMLButtonElement = Array.from(
      fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>,
    ).find((button) => button.textContent?.includes('expirat'))!;
    clearButton.click();
    await fixture.whenStable();

    expect(removeTrips).toHaveBeenCalledWith(new Set(['expired']));
  });
});
