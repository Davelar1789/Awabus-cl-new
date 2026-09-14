# AwaBus

A school bus operations platform — live GPS tracking, route/driver/student/bus
management, and trip history — built as a MERN stack rebuild of the AwaBus
Admin Portal design.

## Repository layout

```
/server   Node/Express + MongoDB (Mongoose) API for both the Admin Portal
          and the (not-yet-built) Driver App, plus a Socket.io live-tracking feed.
/admin    The AwaBus Admin Portal — React + Vite + Tailwind. Every screen from
          the design (auth, dashboard, routes, drivers, students, buses,
          trip history, live tracking) is implemented here.
/driver   Scaffold only. No driver app screens exist yet, but the server API
          it will consume (/api/driver-app) is fully implemented — see
          driver/README.md.
```

## Quick start

### 1. Server

```bash
cd server
cp .env.example .env      # point MONGO_URI at your MongoDB instance
npm install
npm run seed               # wipes and repopulates the DB with demo data
npm run dev                # http://localhost:5000
```

The seed script prints the admin sign-in credentials it created, e.g.:

```
phone:    +233244528983
password: Awabus@123
```

A MongoDB instance is required (local `mongod`, Docker, or Atlas) — set
`MONGO_URI` in `server/.env` accordingly.

### 2. Admin Portal

```bash
cd admin
cp .env.example .env      # defaults to http://localhost:5000/api
npm install
npm run dev                # http://localhost:5173
```

Sign in with the credentials printed by the seed script.

### 3. Driver App (scaffold)

```bash
cd driver
cp .env.example .env
npm install
npm run dev                 # http://localhost:5174
```

This currently renders a "Coming Soon" placeholder. See `driver/README.md`
for what's already wired up (API client) and what to build next.

## What's implemented

**Server** — JWT auth with an OTP-based forgot-password flow, full CRUD +
search/pagination/stats for Routes, Drivers (incl. a mock DVLA license
validation endpoint), Students (+ Guardians), Buses, Trip history, a
Live Tracking read API, a parallel `/api/driver-app` namespace for the future
mobile app (login, today's trip, start/end trip, GPS pings, attendance), a
Socket.io feed for live bus positions, and a demo GPS simulator that nudges
in-progress trips along their route so Live Tracking has something to show
without a live driver app.

**Admin Portal** — Sign in / forgot password / OTP verification / reset
password, Dashboard, Routes (list, add, edit, delete), Drivers (list, profile,
5-step add wizard with license validation, edit), Students (list, profile,
5-step add wizard incl. guardian linking & geofencing, edit with an
interactive map picker), Buses (list, register, profile, edit), Trip History
(list + filters, trip detail with timeline & student progress), and Live
Tracking (map with live bus markers via Socket.io, per-bus detail panel, trip
detail sub-view). Dark mode, responsive tables, empty/error/loading states,
and reusable UI primitives are shared across all of it.

**Driver App** — not built. Folder scaffolded, server API ready.
