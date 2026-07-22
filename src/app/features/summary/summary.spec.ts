import { TestBed } from '@angular/core/testing';
import { TripsStore } from '@core/trips.store';
import type { Trip } from '@models/trip.model';
import { getStatus } from '@shared/schengen-rules/schengen-calculator';

import { Summary } from './summary';

function fakeStore(trips: Trip[], today: string) {
  return { status: () => getStatus(trips, today), trips: () => trips, today: () => today };
}

async function createFixture(trips: Trip[], today: string) {
  TestBed.configureTestingModule({
    imports: [Summary],
    providers: [{ provide: TripsStore, useValue: fakeStore(trips, today) }],
  });
  const fixture = TestBed.createComponent(Summary);
  await fixture.whenStable();
  return fixture;
}

describe('Summary', () => {
  it('shows the remaining days when well under the limit', async () => {
    const fixture = await createFixture(
      [{ id: 't1', entry: '2024-06-01', exit: '2024-06-10' }],
      '2024-06-30',
    );

    expect(fixture.nativeElement.textContent).toContain('Îți mai rămân');
    expect(fixture.nativeElement.textContent).toContain('80');
  });

  it('warns when near the limit', async () => {
    const fixture = await createFixture(
      [{ id: 't1', entry: '2024-04-01', exit: '2024-06-25' }],
      '2024-06-30',
    );

    expect(fixture.nativeElement.textContent).toContain('Te apropii de limită');
  });

  it('reports an overstay past the limit', async () => {
    const fixture = await createFixture(
      [{ id: 't1', entry: '2024-03-27', exit: '2024-06-30' }],
      '2024-06-30',
    );

    expect(fixture.nativeElement.textContent).toContain('Ai depășit limita cu');
  });

  it('warns about a violation baked into already-added future trips', async () => {
    const trips: Trip[] = [
      { id: 'a', entry: '2026-05-01', exit: '2026-07-24' },
      { id: 'b', entry: '2026-08-01', exit: '2026-08-10' },
    ];
    const fixture = await createFixture(trips, '2026-07-22');

    expect(fixture.nativeElement.textContent).toContain('vei depăși limita pe');
  });
});
