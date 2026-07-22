/**
 * Firebase web config — not a secret. It's meant to ship in client code; the
 * actual access control lives in Firestore Security Rules, not in hiding this.
 */
export const firebaseConfig = {
  apiKey: 'AIzaSyAy9EThpaqacZHdLr4WrqJeXNlsH4b_bOE',
  authDomain: 'test-ebf4d.firebaseapp.com',
  projectId: 'test-ebf4d',
  storageBucket: 'test-ebf4d.appspot.com',
  messagingSenderId: '705281046021',
  appId: '1:705281046021:web:abc59488a026d9a2e1ce6c',
};
