# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Quick Commands

```bash
./start-dev.sh                          # Start both servers (backend :3000, frontend :5173)
cd backend && npm run dev               # Backend only
cd frontend && npm run dev              # Frontend only
cd backend && npm run build             # Compile TypeScript → dist/
cd backend && npm run test:db           # Database schema + connectivity
cd backend && npm run test:connection   # TypeScript + DB validation
cd backend && npx ts-node scripts/create-admin.ts  # Create test admin user
cd frontend && npm run lint
docker compose build                    # Build all containers
docker compose up                       # Run containerized stack locally
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
| Email | SendGrid (@sendgrid/mail) |
| Rate Limiting | express-rate-limit |
| Containers | Docker (multi-stage), nginx (frontend SPA serving) |
| CI/CD | GitHub Actions → AWS ECR → ECS |

## Environment Setup

Copy `backend/.env.example` → `backend/.env` and fill in values:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=schedulux_primary
DB_USER=<your_db_user>
DB_PASSWORD=<your_db_password>
JWT_SECRET=<your-secret-key>
NODE_ENV=development
PORT=3000
ALLOWED_ORIGINS=http://localhost:5173
SENDGRID_API_KEY=           # optional in dev — emails log to console if unset
SENDGRID_FROM_EMAIL=noreply@schedulux.com
SENDGRID_FROM_NAME=Schedulux
FRONTEND_URL=http://localhost:5173
```

Copy `frontend/.env.example` → `frontend/.env`:
```
VITE_API_URL=http://localhost:3000/api
```

## Detailed Rules

- Backend patterns, DB schema, API endpoints: @.claude/rules/backend.md
- Frontend patterns, hooks, components: @.claude/rules/frontend.md

## What's Left to Build

See `plan.md` at the project root for the full implementation guide. Summary:

| Feature | Phase | Status |
|---------|-------|--------|
| Docker + CI/CD (AWS ECS) | 1D-1G | Not started |
| Rate limiting (express-rate-limit) | 2 | ✅ Done |
| Email notifications (SendGrid) | 3 | ✅ Done |
| Password reset flow | 4 | ✅ Done |
| Error boundary + 404 page | 5 | ✅ Done |
