import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { addDoc, deleteDoc, onSnapshot, writeBatch } from 'firebase/firestore';

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  collection: vi.fn((_db, ...segments) => ({ path: segments.join('/') })),
  doc: vi.fn((_db, ...segments) => ({ path: segments.join('/') })),
  addDoc: vi.fn(async () => ({ id: 'new-trip' })),
  deleteDoc: vi.fn(async () => undefined),
  onSnapshot: vi.fn(() => () => undefined),
  writeBatch: vi.fn(),
}));

import { AuthService } from './firebase/auth.service';
import { TripsStore } from './trips.store';

type FakeUser = { uid: string } | null;

function configureWithUser(user: FakeUser): { user: ReturnType<typeof signal<FakeUser>> } {
  const fakeAuth = { user: signal<FakeUser>(user) };
  TestBed.configureTestingModule({
    providers: [{ provide: AuthService, useValue: fakeAuth }],
  });
  return fakeAuth;
}

describe('TripsStore subscription', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('has no trips and does not subscribe to Firestore when nobody is signed in', () => {
    configureWithUser(null);
    const store = TestBed.inject(TripsStore);
    TestBed.tick();

    expect(store.trips()).toEqual([]);
    expect(onSnapshot).not.toHaveBeenCalled();
  });

  it('subscribes to Firestore and populates trips once a user signs in', () => {
    const fakeAuth = configureWithUser(null);
    vi.mocked(onSnapshot).mockImplementation((_ref, callback) => {
      (callback as (snapshot: unknown) => void)({
        docs: [{ id: 't1', data: () => ({ entry: '2024-01-01', exit: '2024-01-10' }) }],
      });
      return () => undefined;
    });

    const store = TestBed.inject(TripsStore);
    fakeAuth.user.set({ uid: 'user-1' });
    TestBed.tick();

    expect(store.trips()).toEqual([{ id: 't1', entry: '2024-01-01', exit: '2024-01-10' }]);
  });

  it('clears trips and unsubscribes when the user signs out', () => {
    const fakeAuth = configureWithUser({ uid: 'user-1' });
    const unsubscribe = vi.fn();
    vi.mocked(onSnapshot).mockImplementation((_ref, callback) => {
      (callback as (snapshot: unknown) => void)({
        docs: [{ id: 't1', data: () => ({ entry: '2024-01-01', exit: '2024-01-10' }) }],
      });
      return unsubscribe;
    });

    const store = TestBed.inject(TripsStore);
    TestBed.tick();
    expect(store.trips()).toHaveLength(1);

    fakeAuth.user.set(null);
    TestBed.tick();

    expect(store.trips()).toEqual([]);
    expect(unsubscribe).toHaveBeenCalled();
  });
});

describe('TripsStore mutations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('adds a trip under the signed-in user and rejects when nobody is signed in', async () => {
    configureWithUser({ uid: 'user-1' });
    const store = TestBed.inject(TripsStore);

    await store.addTrip('2024-01-01', '2024-01-10', 'FR');
    expect(addDoc).toHaveBeenCalledWith(
      { path: 'users/user-1/trips' },
      { entry: '2024-01-01', exit: '2024-01-10', countryCode: 'FR' },
    );

    TestBed.resetTestingModule();
    configureWithUser(null);
    const anonymousStore = TestBed.inject(TripsStore);
    await expect(anonymousStore.addTrip('2024-01-01', '2024-01-10', 'FR')).rejects.toThrow();
  });

  it('removes a single trip under the signed-in user', async () => {
    configureWithUser({ uid: 'user-1' });
    const store = TestBed.inject(TripsStore);

    await store.removeTrip('t1');
    expect(deleteDoc).toHaveBeenCalledWith({ path: 'users/user-1/trips/t1' });
  });

  it('bulk-removes trips in a single batch', async () => {
    configureWithUser({ uid: 'user-1' });
    const deleteInBatch = vi.fn();
    const commit = vi.fn(async () => undefined);
    vi.mocked(writeBatch).mockReturnValue({ delete: deleteInBatch, commit } as never);

    const store = TestBed.inject(TripsStore);
    await store.removeTrips(new Set(['t1', 't2']));

    expect(deleteInBatch).toHaveBeenCalledTimes(2);
    expect(commit).toHaveBeenCalled();
  });
});
