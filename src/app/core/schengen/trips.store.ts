import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { addDoc, collection, deleteDoc, doc, onSnapshot, writeBatch } from 'firebase/firestore';
import { AuthService } from '../firebase/auth.service';
import { db } from '../firebase/firebase-app';
import { getStatus, SchengenStatus } from './schengen-calculator';
import { Trip } from './trip.model';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

@Injectable({ providedIn: 'root' })
export class TripsStore {
  private readonly authService = inject(AuthService);

  readonly trips = signal<Trip[]>([]);
  readonly today = signal<string>(todayIso());

  /** Most recent/upcoming trips first, so the list stays useful as it grows over time. */
  readonly sortedTrips = computed(() =>
    [...this.trips()].sort((a, b) => (a.entry < b.entry ? 1 : a.entry > b.entry ? -1 : 0)),
  );

  readonly status = computed<SchengenStatus>(() => getStatus(this.trips(), this.today()));

  private unsubscribe: (() => void) | null = null;

  constructor() {
    effect(() => {
      const user = this.authService.user();
      this.unsubscribe?.();
      this.unsubscribe = null;
      this.trips.set([]);
      if (!user) return;

      this.unsubscribe = onSnapshot(collection(db, 'users', user.uid, 'trips'), (snapshot) => {
        this.trips.set(
          snapshot.docs.map((tripDoc) => ({ id: tripDoc.id, ...tripDoc.data() }) as Trip),
        );
      });
    });
  }

  private requireUid(): string {
    const user = this.authService.user();
    if (!user) throw new Error('No signed-in user.');
    return user.uid;
  }

  async addTrip(entry: string, exit: string, countryCode: string): Promise<void> {
    const uid = this.requireUid();
    await addDoc(collection(db, 'users', uid, 'trips'), { entry, exit, countryCode });
  }

  async removeTrip(id: string): Promise<void> {
    const uid = this.requireUid();
    await deleteDoc(doc(db, 'users', uid, 'trips', id));
  }

  async removeTrips(ids: ReadonlySet<string>): Promise<void> {
    const uid = this.requireUid();
    const batch = writeBatch(db);
    ids.forEach((id) => batch.delete(doc(db, 'users', uid, 'trips', id)));
    await batch.commit();
  }
}
