# Schedulux

> A booking page for your bio, with **drops** built in: post a limited session, share one link, watch the spots go.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue.svg)](https://www.typescriptlang.org/)

Schedulux is for independents — barbers, tattoo artists, trainers, fixers — who already have an audience on Instagram and need somewhere to send it. Each vendor gets one page at `/@handle`. Clients book in a minute **without making an account**. Limited **drops** ("Sunday flash day, 4 spots") show a live spots-left counter and collect a waitlist when they sell out.

Under it is a standalone, timezone-correct **availability engine** ([`packages/availability-engine`](packages/availability-engine)), with an interactive playground at `/playground`.

<!-- Screenshots: public page · drop page (sold out + waitlist) · playground (DST preset) -->

## What it does

**For clients (no account)**
- Book a service or a drop slot with name + email (+ optional phone)
- Get a private manage link (emailed and shown on screen) to reschedule or cancel
- Join a sold-out drop's waitlist; everyone waiting is emailed when a spot opens

**For vendors**
- Claim a handle, add services and regular hours (weekly / one-day / monthly rules with priorities)
- Post drops: a dated window with per-slot capacity that overrides regular hours, even closures
- Copy-link buttons for the page and each drop; live spot counts and waitlist sizes on the dashboard
- Approve or decline requests; appointments list, calendar, and customers (grouped by email)

**Under the hood**
- [Availability engine](packages/availability-engine): rules → sweep-line priority resolution → slots, DST-safe, pure, tested under a non-UTC host timezone
- Booking writes take a per-page PostgreSQL advisory lock and re-check capacity on the transaction's own connection; `npm run demo:race` proves it:

```
Round 1 · naive check-then-insert (no lock)
  191 booked, 9 rejected in 78ms — ❌ oversold by 190
Round 2 · AppointmentService (per-page advisory lock)
  1 booked, 199 rejected in 72ms — ✅ exactly one winner
```

## Architecture

```
packages/availability-engine   pure TS library (ESM + CJS), no DB
        ▲                 ▲
        │ file: dep       │ file: dep
backend/ (Express + PostgreSQL)      frontend/ (React + Vite)
  routes → services → models           pages → hooks (React Query) → api.ts
  AvailabilityService = DB adapter     /playground runs the engine client-side
```

| Layer | Technology |
|-------|------------|
| Engine | TypeScript, date-fns + date-fns-tz, tsup, Vitest |
| Backend | Express, PostgreSQL 15 (advisory locks), JWT (vendors only), SendGrid, Cloudinary |
| Frontend | React 18, Vite, React Router 7, React Query, Zustand, Tailwind (design tokens), Zod |
| Infra | Docker (multi-stage, repo-root context), nginx, Caddy, GitHub Actions CI |

## Getting started

Prerequisites: Node 20+, PostgreSQL 15+.

```bash
# 1. Engine (backend and frontend import its dist/)
cd packages/availability-engine && npm install && npm run build && cd ../..

# 2. Backend
cd backend && cp .env.example .env   # set DB_* and JWT_SECRET
npm install
npm run build && npm run migrate     # applies backend/migrations in order
npm run seed:heroes                  # demo pages: /@midnightbarber, /@fixit, /@sundayflash
cd ..

# 3. Frontend
cd frontend && cp .env.example .env && npm install && cd ..

# 4. Run both
./start-dev.sh                       # API :3000, app :5173
```

Demo vendor logins: `midnight@schedulux.dev`, `fixit@schedulux.dev`, `flash@schedulux.dev` (password `Hero123!`). `@sundayflash` has a sold-out drop with a waitlist. Without `SENDGRID_API_KEY`, emails (including manage links and waitlist notices) are logged to the backend console.

Docker: `docker compose -f docker-compose.local.yml up --build` runs Postgres, the API (migrations on start), and the SPA on :8080.

## Testing

```bash
cd packages/availability-engine && npm test   # engine: priorities, DST, timezones
cd backend && npm test && npm run typecheck    # services with models mocked
cd frontend && npm run typecheck && npm run lint
cd backend && npm run demo:race -- <slug> 200  # real DB: concurrent bookings vs. one spot
```

## API at a glance

| Endpoint | Auth | Purpose |
|---|---|---|
| `GET /api/pages/:slug` | — | Page, services, upcoming drops with `total_spots` / `remaining_spots` |
| `GET /api/storefronts/:id/availability` | — | Bookable slots for a service and date range |
| `POST /api/appointments` | — | Guest booking; returns `manage_token` |
| `GET / POST /api/bookings/:token[/cancel\|/reschedule]` | token | Guest self-service |
| `POST /api/drops/:id/waitlist` | — | Join a sold-out drop's waitlist |
| `GET /api/slugs/:slug/available` | — | Handle availability for onboarding |
| `/api/storefronts`, `/services`, `/rules`, `/drops`, `/appointments/:id/*` | vendor JWT | Manage the page |

Full details live in [`.claude/rules/backend.md`](.claude/rules/backend.md).

## License

MIT
