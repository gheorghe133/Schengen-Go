import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AuthService } from './core/firebase/auth.service';
import { SignIn } from './features/auth/sign-in';
import { ThemeSwitcher } from './shared/ui/theme-switcher/theme-switcher';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ThemeSwitcher, SignIn],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('Schengen Go');
  protected readonly authService = inject(AuthService);
}
