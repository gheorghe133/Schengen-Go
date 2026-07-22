import { TestBed } from '@angular/core/testing';

import { Dashboard } from './dashboard';

describe('Dashboard', () => {
  it('renders every section without throwing', async () => {
    TestBed.configureTestingModule({ imports: [Dashboard] });
    const fixture = TestBed.createComponent(Dashboard);
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Călătoriile mele');
    expect(text).toContain('Simulează o călătorie');
    expect(text).toContain('Zile folosite din ultimele 180');
  });
});
