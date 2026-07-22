import { TestBed } from '@angular/core/testing';
import { TripsStore } from '@core/trips.store';

import { TripForm } from './trip-form';

async function createFixture(
  addTrip: (entry: string, exit: string, countryCode: string) => Promise<void>,
) {
  TestBed.configureTestingModule({
    imports: [TripForm],
    providers: [{ provide: TripsStore, useValue: { addTrip } }],
  });
  const fixture = TestBed.createComponent(TripForm);
  await fixture.whenStable();
  return fixture;
}

function fillAndSubmit(
  fixture: ReturnType<typeof TestBed.createComponent>,
  entry: string,
  exit: string,
  countryCode: string,
) {
  const entryInput: HTMLInputElement = fixture.nativeElement.querySelector('input[name="entry"]');
  const exitInput: HTMLInputElement = fixture.nativeElement.querySelector('input[name="exit"]');
  const countrySelect: HTMLSelectElement = fixture.nativeElement.querySelector(
    'select[name="countryCode"]',
  );
  entryInput.value = entry;
  entryInput.dispatchEvent(new Event('input'));
  exitInput.value = exit;
  exitInput.dispatchEvent(new Event('input'));
  countrySelect.value = countryCode;
  countrySelect.dispatchEvent(new Event('change'));
  fixture.nativeElement.querySelector('button[type="submit"]').click();
}

describe('TripForm', () => {
  it('rejects submission without a country selected', async () => {
    const addTrip = vi.fn();
    const fixture = await createFixture(addTrip);

    fillAndSubmit(fixture, '2024-01-01', '2024-01-10', '');

    expect(addTrip).not.toHaveBeenCalled();
    expect(fixture.debugElement.componentInstance.error).toBe('Selectează țara.');
  });

  it('resets the form immediately on submit, without waiting for the save to finish', async () => {
    let resolveAdd: () => void = () => undefined;
    const addTrip = vi.fn(() => new Promise<void>((resolve) => (resolveAdd = resolve)));
    const fixture = await createFixture(addTrip);

    fillAndSubmit(fixture, '2024-01-01', '2024-01-10', 'FR');

    expect(addTrip).toHaveBeenCalledWith('2024-01-01', '2024-01-10', 'FR');
    const component = fixture.debugElement.componentInstance;
    expect(component.entry).toBe('');
    expect(component.exit).toBe('');
    expect(component.countryCode).toBe('');

    resolveAdd();
  });

  it('restores the fields and shows an error when the save fails', async () => {
    const addTrip = vi.fn().mockRejectedValue(new Error('offline'));
    const fixture = await createFixture(addTrip);

    fillAndSubmit(fixture, '2024-01-01', '2024-01-10', 'FR');
    await fixture.whenStable();

    const component = fixture.debugElement.componentInstance;
    expect(component.error).toBe('Nu am putut salva călătoria. Încearcă din nou.');
    expect(component.entry).toBe('2024-01-01');
    expect(component.exit).toBe('2024-01-10');
    expect(component.countryCode).toBe('FR');
  });
});
