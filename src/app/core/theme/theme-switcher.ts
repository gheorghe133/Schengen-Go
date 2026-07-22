import { Component, inject } from '@angular/core';

import { ThemePreference, ThemeService } from './theme.service';

@Component({
  selector: 'app-theme-switcher',
  templateUrl: './theme-switcher.html',
})
export class ThemeSwitcher {
  protected readonly themeService = inject(ThemeService);

  protected readonly options: { value: ThemePreference; label: string }[] = [
    { value: 'system', label: 'Sistem' },
    { value: 'light', label: 'Luminos' },
    { value: 'dark', label: 'Întunecat' },
  ];
}
