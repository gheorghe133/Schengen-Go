import { Injectable, signal } from '@angular/core';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';

import { auth } from './firebase-app';

@Injectable({ providedIn: 'root' })
export class AuthService {
  public readonly user = signal<User | null>(null);
  /** True once Firebase has resolved the initial auth state (signed in or not). */
  public readonly ready = signal(false);

  constructor() {
    onAuthStateChanged(auth, (user) => {
      this.user.set(user);
      this.ready.set(true);
    });
  }

  public async signInWithGoogle(): Promise<void> {
    await signInWithPopup(auth, new GoogleAuthProvider());
  }

  public async signOutUser(): Promise<void> {
    await signOut(auth);
  }
}
