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
| Image Uploads | Cloudinary (multer + cloudinary SDK) |
| Containers | Docker (multi-stage), nginx (frontend SPA serving), Caddy (reverse proxy + auto HTTPS) |
| CI/CD | GitHub Actions → SSH deploy to AWS EC2 |

## Environment Setup

Copy `backend/.env.example` → `backend/.env` and fill in values:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=schedulux_primary
DB_USER=<your_db_user>
DB_PASSWORD=<your_db_password>
JWT_SECRET=<your-secret-key>        # REQUIRED — app refuses to start if missing
NODE_ENV=development
PORT=3000
ALLOWED_ORIGINS=http://localhost:5173
SENDGRID_API_KEY=           # optional in dev — emails log to console if unset
SENDGRID_FROM_EMAIL=noreply@schedulux.com
SENDGRID_FROM_NAME=Schedulux
FRONTEND_URL=http://localhost:5173  # REQUIRED in prod — used in password reset emails
CLOUDINARY_CLOUD_NAME=      # optional — image uploads return 503 if unset
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Copy `frontend/.env.example` → `frontend/.env`:
```
VITE_API_URL=http://localhost:3000/api
```

## Detailed Rules

- Backend patterns, DB schema, API endpoints: @.claude/rules/backend.md
- Frontend patterns, hooks, components: @.claude/rules/frontend.md

## Deployment

- Full AWS EC2 + RDS setup: `DEPLOYMENT_GUIDE.md`
- GitHub Actions CI/CD pipeline: `CICD_GUIDE.md`
- Local Docker stack: `docker compose -f docker-compose.local.yml up`
- Production Docker stack: `docker compose up` (requires `.env` with RDS credentials)

## Project Status

| Feature | Status |
|---------|--------|
| Core scheduling (rules, availability, booking) | ✅ Done |
| Rate limiting | ✅ Done |
| Email notifications (SendGrid) | ✅ Done |
| Password reset flow | ✅ Done |
| Error boundary + 404 page | ✅ Done |
| Marketplace + geolocation search | ✅ Done |
| Drops feature | ✅ Done |
| Admin dashboard | ✅ Done |
| Image uploads (Cloudinary) | ✅ Done |
| Docker + Caddy + nginx | ✅ Done |
| CI/CD (GitHub Actions → EC2) | ✅ Done |
| Reschedule flow | ✅ Done |
