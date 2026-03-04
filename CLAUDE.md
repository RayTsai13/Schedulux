# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Quick Commands

```bash
./start-dev.sh                          # Start both servers (backend :3000, frontend :5173)
cd backend && npm run dev               # Backend only
cd frontend && npm run dev              # Frontend only
cd backend && npm run test:db           # Database schema + connectivity
cd backend && npm run test:connection   # TypeScript + DB validation
cd backend && npx ts-node scripts/create-admin.ts  # Create test admin user
cd frontend && npm run lint
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript, Vite, React Router 7.9 |
| State | Zustand (UI state), React Query 5 (server state) |
| Styling | TailwindCSS + shadcn/ui |
| Forms | React Hook Form + Zod |
| Backend | Express.js + TypeScript |
| Auth | JWT + bcryptjs (token stored in localStorage) |
| Validation | express-validator + Zod |
| Database | PostgreSQL 15+, connection pool (20 max), JSONB, exclusion constraints |
| Date/Time | date-fns + date-fns-tz (timezone-aware) |
| Concurrency | PostgreSQL advisory locks (race condition prevention) |

## Environment Setup

**backend/.env:**
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=schedulux_primary
DB_USER=<your_db_user>
DB_PASSWORD=<your_db_password>
JWT_SECRET=<your-secret-key>
NODE_ENV=development
PORT=3000
```

## Detailed Rules

- Backend patterns, DB schema, API endpoints: @.claude/rules/backend.md
- Frontend patterns, hooks, components: @.claude/rules/frontend.md

## What's Left to Build

- Client appointment management page (view, cancel, reschedule)
- Marketplace homepage / storefront discovery listing
- Booking state restoration after login redirect (sessionStorage integration)
- Email notifications for appointments
- Admin dashboard
