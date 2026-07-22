import { Injectable, signal } from '@angular/core';
import type { User } from 'firebase/auth';
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';

import { auth } from './firebase-app';

@Injectable({ providedIn: 'root' })
export class AuthService {
  public readonly user = signal<User | null>(null);
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
