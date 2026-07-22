# Schengen Go

A web app that tracks the Schengen Area's 90-days-in-any-180-days rule, so
you always know exactly how many days you have left.

## Features

- **Trip log** — add entry/exit dates and a Schengen country per trip; the
  list distinguishes expired, in-window, and future/planned trips.
- **Compliance summary** — days used out of 90, days remaining, and an
  early warning if trips already on the calendar will cause a future
  overstay (even if today's count looks fine).
- **Calendar view** — a month grid highlighting which days count toward
  the rolling 180-day window.
- **Simulate a trip** — check whether a hypothetical trip would be
  compliant before booking it, accounting for every trip already on file.
- **Google sign-in + sync** — trips are stored per-account in Firestore
  and sync across devices in real time.
- **Light / dark / system theme.**

## Tech stack

- [Angular 21](https://angular.dev) — standalone components, signals
- [Tailwind CSS 4](https://tailwindcss.com)
- [Firebase](https://firebase.google.com) — Google auth + Firestore
- [Vitest](https://vitest.dev) — unit and component tests
- ESLint (`angular-eslint`) + Prettier + Husky + Commitlint

## Getting started

```bash
npm install
```

The app needs a Firebase project with **Google sign-in** enabled and a
**Firestore** database. The web config lives in
[`src/app/core/firebase/firebase-config.ts`](src/app/core/firebase/firebase-config.ts) —
it's a public client config, not a secret; access control is enforced by
Firestore Security Rules (`request.auth.uid == userId`), not by hiding it.

```bash
npm start          # ng serve — http://localhost:4200
```

## Project structure

```text
src/app/
├── core/            # singletons — one instance for the whole app
│   ├── firebase/    # Firebase init, auth
│   ├── theme.service.ts
│   └── trips.store.ts
├── shared/          # reusable, stateless code used by 2+ features
│   ├── ui/          # dumb, reusable components (e.g. theme switcher)
│   ├── schengen-rules/  # the 90/180 calculation engine + country list
│   └── date-utils.ts
├── models/          # every interface/type, kept central
└── features/        # one folder per screen: auth, dashboard, calendar,
                      # simulate, summary, trips
```

Path aliases (`@core/*`, `@shared/*`, `@models/*`, `@features/*`) are
configured in `tsconfig.json`, so imports don't need `../../` chains.

## Scripts

```bash
npm test            # unit + component tests (Vitest)
npm run lint         # ESLint
npm run lint:fix     # ESLint with autofix
npm run format       # Prettier — write
npm run format:check # Prettier — check only
npm run build        # production build
```

## Contributing

- Work on a branch, open a PR — no direct pushes to `main`.
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/)
  (enforced by a commit-msg hook).
- `pre-commit` runs lint + format on staged files; `pre-push` runs the
  full lint and format check.
