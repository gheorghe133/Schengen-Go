import { Component, inject } from '@angular/core';

import { AuthService } from './auth.service';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.html',
})
export class SignIn {
  protected readonly auth = inject(AuthService);
  protected error: string | null = null;
  protected loading = false;

  protected async signIn(): Promise<void> {
    this.error = null;
    this.loading = true;
    try {
      await this.auth.signInWithGoogle();
    } catch {
      this.error = 'Autentificarea a eșuat. Încearcă din nou.';
    } finally {
      this.loading = false;
    }
  }
}
