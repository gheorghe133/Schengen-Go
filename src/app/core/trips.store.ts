import { computed, effect, inject, Injectable, signal } from '@angular/core';
import type { SchengenStatus } from '@models/schengen-status.model';
import type { Trip } from '@models/trip.model';
import { getStatus } from '@shared/schengen-rules/schengen-calculator';
import { addDoc, collection, deleteDoc, doc, onSnapshot, writeBatch } from 'firebase/firestore';

import { AuthService } from './firebase/auth.service';
import { db } from './firebase/firebase-app';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

@Injectable({ providedIn: 'root' })
export class TripsStore {
  private readonly authService = inject(AuthService);
  private unsubscribe: (() => void) | null = null;

  public readonly trips = signal<Trip[]>([]);
  public readonly today = signal<string>(todayIso());
  public readonly ready = signal(false);

  public readonly sortedTrips = computed(() =>
    [...this.trips()].sort((a, b) => (a.entry < b.entry ? 1 : a.entry > b.entry ? -1 : 0)),
  );

  public readonly status = computed<SchengenStatus>(() => getStatus(this.trips(), this.today()));

  constructor() {
    effect(() => {
      const user = this.authService.user();
      this.unsubscribe?.();
      this.unsubscribe = null;
      this.trips.set([]);
      this.ready.set(false);
      if (!user) return;

      this.unsubscribe = onSnapshot(collection(db, 'users', user.uid, 'trips'), (snapshot) => {
        this.trips.set(
          snapshot.docs.map((tripDoc) => ({ id: tripDoc.id, ...tripDoc.data() }) as Trip),
        );
        this.ready.set(true);
      });
    });
  }

  public async addTrip(entry: string, exit: string, countryCode: string): Promise<void> {
    const uid = this.requireUid();
    await addDoc(collection(db, 'users', uid, 'trips'), { entry, exit, countryCode });
  }

  public async removeTrip(id: string): Promise<void> {
    const uid = this.requireUid();
    await deleteDoc(doc(db, 'users', uid, 'trips', id));
  }

  public async removeTrips(ids: ReadonlySet<string>): Promise<void> {
    const uid = this.requireUid();
    const batch = writeBatch(db);
    ids.forEach((id) => batch.delete(doc(db, 'users', uid, 'trips', id)));
    await batch.commit();
  }

  private requireUid(): string {
    const user = this.authService.user();
    if (!user) throw new Error('No signed-in user.');
    return user.uid;
  }
}
