import { TestBed } from '@angular/core/testing';
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  GoogleAuthProvider: vi.fn(),
  onAuthStateChanged: vi.fn(() => () => undefined),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
}));

import { AuthService } from './auth.service';

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(onAuthStateChanged).mockReturnValue(() => undefined);
    TestBed.configureTestingModule({});
  });

  it('starts unresolved, with no user', () => {
    const service = TestBed.inject(AuthService);
    expect(service.ready()).toBe(false);
    expect(service.user()).toBeNull();
  });

  it('stores the user and marks itself ready once Firebase resolves the auth state', () => {
    let resolveAuthState: (user: unknown) => void = () => undefined;
    vi.mocked(onAuthStateChanged).mockImplementation((_auth, callback) => {
      resolveAuthState = callback as (user: unknown) => void;
      return () => undefined;
    });

    const service = TestBed.inject(AuthService);
    const fakeUser = { uid: 'user-1' };
    resolveAuthState(fakeUser);

    expect(service.ready()).toBe(true);
    expect(service.user()).toBe(fakeUser);
  });

  it('signs in with a Google popup', async () => {
    vi.mocked(signInWithPopup).mockResolvedValue({} as never);
    const service = TestBed.inject(AuthService);

    await service.signInWithGoogle();

    expect(signInWithPopup).toHaveBeenCalledWith(expect.anything(), expect.any(GoogleAuthProvider));
  });

  it('signs out', async () => {
    vi.mocked(signOut).mockResolvedValue();
    const service = TestBed.inject(AuthService);

    await service.signOutUser();

    expect(signOut).toHaveBeenCalled();
  });
});
