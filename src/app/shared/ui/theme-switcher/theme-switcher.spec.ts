import { TestBed } from '@angular/core/testing';
import { ThemeService } from '@core/theme.service';

import { ThemeSwitcher } from './theme-switcher';

describe('ThemeSwitcher', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ imports: [ThemeSwitcher] });
  });

  it('renders the three theme options', async () => {
    const fixture = TestBed.createComponent(ThemeSwitcher);
    await fixture.whenStable();

    const buttons = fixture.nativeElement.querySelectorAll('button[role="radio"]');
    expect(buttons).toHaveLength(3);
    expect(Array.from(buttons).map((button) => (button as HTMLElement).title)).toEqual([
      'Sistem',
      'Luminos',
      'Întunecat',
    ]);
  });

  it('sets the preference when an option is clicked', async () => {
    const fixture = TestBed.createComponent(ThemeSwitcher);
    await fixture.whenStable();

    const darkButton = Array.from(
      fixture.nativeElement.querySelectorAll('button[role="radio"]') as NodeListOf<HTMLElement>,
    ).find((button) => button.title === 'Întunecat');
    darkButton?.click();

    const themeService = TestBed.inject(ThemeService);
    expect(themeService.preference()).toBe('dark');
  });
});
