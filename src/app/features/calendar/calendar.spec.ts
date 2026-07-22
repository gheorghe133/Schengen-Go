import { TestBed } from '@angular/core/testing';

import { Calendar } from './calendar';

describe('Calendar', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Calendar],
    }).compileComponents();
  });

  it('constructs and renders the current month without throwing', async () => {
    // Regression guard: the view-state signals read `this.store` in their own
    // initializer, so `store` must be assigned before them in declaration order —
    // reordering fields by accessibility (e.g. for a linter rule) can silently
    // break this, since field initializers run top-to-bottom at construction time.
    const fixture = TestBed.createComponent(Calendar);
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const today = new Date();
    const expectedYear = String(today.getFullYear());
    expect(compiled.textContent).toContain(expectedYear);
  });
});
