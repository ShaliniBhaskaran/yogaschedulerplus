# YogiTrack — Yoga Scheduler

A MERN (MongoDB, Express, React, Node) app for a yoga studio manager to:

1. **Add an instructor** — with duplicate-name detection and a mock welcome notification.
2. **Add a class** — with schedule-conflict detection and suggested alternative time slots.

Built with TypeScript on both the server and client, Tailwind CSS for styling, JWT-based manager login, and automated tests (Jest/Supertest on the backend, Vitest/React Testing Library on the frontend).

## Prerequisites

- Node.js 18+
- A running MongoDB instance — either:
  - **Local**: install via Homebrew (`brew install mongodb-community`) and make sure it's running (`brew services list`), or
  - **Atlas**: a free cloud cluster, using its connection string instead of the local one below.

## Setup

1. **Install dependencies** (root, server, and client):
   ```
   npm run install-all
   ```

2. **Configure environment variables.**

   `server/.env` (copy from `server/.env.example` and fill in real values):
   ```
   PORT=4000
   MONGO_URI=mongodb://127.0.0.1:27017/yogascheduler
   JWT_SECRET=replace-with-any-long-random-string
   MANAGER_EMAIL=manager@yogahom.com
   MANAGER_PASSWORD=changeme123
   ```
   > Note: port `4000` is used instead of `5000` because macOS's AirPlay Receiver occupies port 5000 by default and silently intercepts requests.

   `client/.env` (copy from `client/.env.example`):
   ```
   VITE_API_URL=http://localhost:4000/api
   ```

3. **Seed the manager account** (creates the login used by the frontend, from the `MANAGER_EMAIL`/`MANAGER_PASSWORD` values above):
   ```
   npm run seed
   ```

4. **Run both the API and the frontend together:**
   ```
   npm run dev
   ```
   - API: http://localhost:4000
   - Frontend: http://localhost:5173 (or the next available port, printed in the terminal)

   Log in with the `MANAGER_EMAIL`/`MANAGER_PASSWORD` you set in `server/.env`.

## Running tests

```
npm test
```
Runs the backend Jest suite (against a throwaway in-memory MongoDB, so it never touches your real data) and the frontend Vitest suite.

Individually:
```
npm test --prefix server
npm test --prefix client
```

## Project structure

```
yogascheduler/
├── server/    # Express + MongoDB API (TypeScript)
│   └── src/
│       ├── config/       # DB connection
│       ├── models/       # Mongoose schemas (Instructor, Class, Manager, Counter, Notification)
│       ├── controllers/  # Route handlers
│       ├── routes/       # Express routers
│       ├── middleware/   # JWT auth middleware
│       ├── services/     # ID generation, schedule-conflict logic, mock notifications
│       ├── scripts/       # seedManager.ts
│       ├── app.ts        # Express app + route mounting
│       └── server.ts     # Entry point (connects DB, starts listening)
├── client/    # Vite + React + TypeScript frontend
│   └── src/
│       ├── api/          # Axios client + typed API call helpers
│       ├── context/      # AuthContext (JWT login state)
│       ├── components/   # Login guard, Instructor/Class forms & lists
│       └── pages/        # LoginPage, DashboardPage
└── package.json  # Root scripts to install/run/test both projects together
```

## How the two use cases work

**Add an instructor:** manager enters first/last name → app checks for an existing instructor with the same name and asks for confirmation if one exists → manager fills in the rest of the details → app generates a sequential ID (`I00001`, `I00002`, ...) and saves the record → a mock welcome notification is generated (logged to the server console and stored in a `Notification` collection — no real email/SMS is sent, since this is a demo/learning project).

**Add a class:** manager picks an instructor, day, time, duration, class type, and pay rate → the app checks whether that day/time overlaps an already-published class (the studio can only run one class at a time) → if it conflicts, a few open alternative time slots are suggested → manager picks one (or adjusts manually) and re-submits → the class is published and mock notifications are sent to both the manager and the instructor.

## Known quirks worth knowing about

- **Port 5000 is unusable for local dev on macOS** — AirPlay Receiver silently intercepts it. The API runs on 4000 instead.
- **TypeScript 7.x is very new** and broke `ts-node-dev` and `ts-jest`'s peer-dependency ranges during setup — the server dev tooling uses `tsx` instead of `ts-node-dev`, and `typescript` is pinned to `^5.7.3` (a version both `ts-jest` and the rest of the ecosystem support) in `server/package.json`.
- **MongoDB Node driver 7.6.0 has a Jest-specific bug** (upstream ticket `NODE-7832`) that breaks `mongodb-memory-server` under Jest — worked around with an `"overrides": {"mongodb": "7.5.0"}` entry in `server/package.json`.
