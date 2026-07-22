import { TestBed } from '@angular/core/testing';
import { AuthService } from '@core/firebase/auth.service';

import { SignIn } from './sign-in';

describe('SignIn', () => {
  function configure(signInWithGoogle: () => Promise<void>) {
    TestBed.configureTestingModule({
      imports: [SignIn],
      providers: [{ provide: AuthService, useValue: { signInWithGoogle } }],
    });
  }

  it('signs in with Google when the button is clicked', async () => {
    const signInWithGoogle = vi.fn().mockResolvedValue(undefined);
    configure(signInWithGoogle);

    const fixture = TestBed.createComponent(SignIn);
    await fixture.whenStable();
    fixture.nativeElement.querySelector('button').click();
    await fixture.whenStable();

    expect(signInWithGoogle).toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).not.toContain('Autentificarea a eșuat');
  });

  it('shows an error message when sign-in fails', async () => {
    const signInWithGoogle = vi.fn().mockRejectedValue(new Error('popup closed'));
    configure(signInWithGoogle);

    const fixture = TestBed.createComponent(SignIn);
    await fixture.whenStable();
    fixture.nativeElement.querySelector('button').click();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain(
      'Autentificarea a eșuat. Încearcă din nou.',
    );
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(button.disabled).toBe(false);
  });
});
