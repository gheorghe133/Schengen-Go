import { computed, effect, Injectable, signal } from '@angular/core';

export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'schengen-go.theme';

function loadInitialPreference(): ThemePreference {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'system' || stored === 'light' || stored === 'dark') return stored;
  }
  return 'system';
}

function systemPrefersDarkNow(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
}

@Injectable({ providedIn: 'root' })
export class ThemeService {
  public readonly preference = signal<ThemePreference>(loadInitialPreference());

  public readonly resolvedTheme = computed<ResolvedTheme>(() => {
    const preference = this.preference();
    return preference === 'system' ? (this.systemPrefersDark() ? 'dark' : 'light') : preference;
  });

  private readonly systemPrefersDark = signal(systemPrefersDarkNow());

  constructor() {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      window
        .matchMedia('(prefers-color-scheme: dark)')
        .addEventListener('change', (event) => this.systemPrefersDark.set(event.matches));
    }

    effect(() => {
      if (typeof document === 'undefined') return;
      document.documentElement.classList.toggle('dark', this.resolvedTheme() === 'dark');
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, this.preference());
      }
    });
  }

  public setPreference(preference: ThemePreference): void {
    this.preference.set(preference);
  }
}
