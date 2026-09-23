# AwaBus Driver App

A mobile-first React web app for AwaBus drivers to run their daily trip:
sign in, take pre-trip attendance, start the trip, share live GPS, scan
students onto the bus, broadcast delay SMS to parents, and end the trip —
all against the real `/api/driver-app` backend in `/server`.

## Getting started

```bash
npm install
cp .env.example .env
npm run dev
```

Sign in with a driver phone/password from the server's seed script (see the
root README) — e.g. `+233 24 412 3456` / `Driver@123`.

## How it fits together

- **Auto-provisioned trips.** The first time a driver opens the Home screen
  each day, the server creates that day's trip from their current bus/route
  assignment if one doesn't exist yet (`GET /api/driver-app/trips/today`) —
  nothing needs to be scheduled in the Admin Portal first.
- **Offline resilience.** While a trip is active, GPS pings and student scans
  that fail to reach the server (`src/store/offlineQueueStore.js`) are queued
  in `localStorage` and replayed automatically on the next `online` event
  (`src/hooks/useOfflineSync.js`), matching the "Data will sync when you
  reconnect" behavior in the design.
- **Live GPS.** `src/hooks/useGeolocation.js` wraps `navigator.geolocation.
  watchPosition`; positions are throttled and pushed to
  `POST /trips/:id/location`, the same endpoint the Admin Portal's Live
  Tracking map reads from via Socket.io.
- **Delay broadcasts.** `POST /trips/:id/delay-broadcast` sends a mock SMS
  (logged server-side — no gateway wired up yet) to the guardians of every
  student marked "Present" for the trip, and records the broadcast for
  Broadcast History.

## Structure

```
src/
  api/            axios client + typed wrappers over every /api/driver-app endpoint
  store/          zustand stores: auth, ui/prefs, connection status, offline queue, reset flow
  hooks/          useGeolocation, useOnlineStatus-style connection tracking, useOfflineSync
  components/
    layout/       Header, TripHeader (active-trip banner), Drawer, AppShell, AuthLayout
    ui/           Button, Input, PhoneInput, Badge, Card, Modal, Switch, OtpInput, Avatar
  pages/
    auth/         Sign in, forgot password, OTP verify, reset password
    home/         Pre-trip Home screen + Start Trip confirmation
    trip/         Active Trip, Delay Broadcast, Broadcast Sent, Trip Completed
    history/      Trip History (+ detail), Broadcast History
    settings/     Settings, Help & support
```
