# AwaBus Driver App (scaffold)

This app is intentionally **not built out yet** — no login, trip, or tracking
screens exist. What's here is just enough tooling so development can start
immediately:

- Vite + React, matching the admin portal's stack.
- `src/api/client.js` / `src/api/driverApp.js` — a ready-made wrapper over
  every endpoint the server already exposes at `/api/driver-app` (login,
  today's trip, start/end trip, GPS location pings, student attendance).
- Tailwind configured with the same AwaBus color tokens used by the admin
  portal, so screens can match the brand from the first commit.

## Why the server API already exists

The backend (`/server`) implements the full driver-facing contract — auth,
fetching the day's assigned trip, starting/ending a trip, streaming GPS
coordinates, and marking student attendance/drop-off — documented in
`server/src/routes/driverAppRoutes.js`. That means building this app is purely
a frontend effort; no backend changes should be required for a first version.

## Getting started

```bash
npm install
cp .env.example .env
npm run dev
```

## Suggested first screens

1. Sign in (phone + password against `POST /api/driver-app/auth/login`)
2. Today's trip overview (`GET /api/driver-app/trips/today`)
3. Start Trip / End Trip actions
4. Background GPS reporting while a trip is in progress
5. Student roster with attendance + drop-off actions
