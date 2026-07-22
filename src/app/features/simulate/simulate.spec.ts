import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TripsStore } from '@core/trips.store';
import type { Trip } from '@models/trip.model';

import { Simulate } from './simulate';

async function createFixture(trips: Trip[] = []) {
  TestBed.configureTestingModule({
    imports: [Simulate],
    providers: [{ provide: TripsStore, useValue: { trips: signal(trips) } }],
  });
  const fixture = TestBed.createComponent(Simulate);
  await fixture.whenStable();
  return fixture;
}

function setDate(fixture: ReturnType<typeof TestBed.createComponent>, name: string, value: string) {
  const input: HTMLInputElement = fixture.nativeElement.querySelector(`input[name="${name}"]`);
  input.value = value;
  input.dispatchEvent(new Event('input'));
}

function submit(fixture: ReturnType<typeof TestBed.createComponent>) {
  fixture.nativeElement.querySelector('button[type="submit"]').click();
}

describe('Simulate', () => {
  it('rejects an incomplete date range without calling the calculator', async () => {
    const fixture = await createFixture();
    setDate(fixture, 'simEntry', '2024-01-01');
    submit(fixture);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Completează ambele date.');
  });

  it('reports a compliant trip when there is nothing else on record', async () => {
    const fixture = await createFixture();
    setDate(fixture, 'simEntry', '2024-01-01');
    setDate(fixture, 'simExit', '2024-01-10');
    submit(fixture);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Poți face această călătorie');
  });

  it('flags a violation and reports the max consecutive stay from the entry date', async () => {
    const fixture = await createFixture();
    setDate(fixture, 'simEntry', '2024-01-01');
    setDate(fixture, 'simExit', '2024-04-30'); // 121 days, well over the limit
    submit(fixture);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Nu poți face toată călătoria');
    expect(fixture.nativeElement.textContent).toContain('90');
  });

  it('resets the form, hiding the result and clearing the fields', async () => {
    const fixture = await createFixture();
    setDate(fixture, 'simEntry', '2024-01-01');
    setDate(fixture, 'simExit', '2024-04-30');
    submit(fixture);
    await fixture.whenStable();

    fixture.nativeElement.querySelector('button[type="button"]').click();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).not.toContain('Nu poți face toată călătoria');
    const entryInput: HTMLInputElement =
      fixture.nativeElement.querySelector('input[name="simEntry"]');
    expect(entryInput.value).toBe('');
  });
});
