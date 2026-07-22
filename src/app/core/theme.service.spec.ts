import { TestBed } from '@angular/core/testing';

import { ThemeService } from './theme.service';

const STORAGE_KEY = 'schengen-go.theme';

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    TestBed.configureTestingModule({});
  });

  it('defaults to "system" when nothing is stored', () => {
    const service = TestBed.inject(ThemeService);
    expect(service.preference()).toBe('system');
  });

  it('restores a previously stored preference', () => {
    localStorage.setItem(STORAGE_KEY, 'dark');
    const service = TestBed.inject(ThemeService);
    expect(service.preference()).toBe('dark');
  });

  it('falls back to "system" for an invalid stored value', () => {
    localStorage.setItem(STORAGE_KEY, 'neon');
    const service = TestBed.inject(ThemeService);
    expect(service.preference()).toBe('system');
  });

  it('resolves "light" and "dark" preferences directly', () => {
    const service = TestBed.inject(ThemeService);
    service.setPreference('dark');
    expect(service.resolvedTheme()).toBe('dark');
    service.setPreference('light');
    expect(service.resolvedTheme()).toBe('light');
  });

  it('persists the preference and toggles the dark class on the document', () => {
    const service = TestBed.inject(ThemeService);
    service.setPreference('dark');
    TestBed.tick();

    expect(localStorage.getItem(STORAGE_KEY)).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    service.setPreference('light');
    TestBed.tick();

    expect(localStorage.getItem(STORAGE_KEY)).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
