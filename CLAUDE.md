# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

## Architecture Overview

### Project Structure
```
backend/src/
├── config/       # DB connection pooling (PostgreSQL)
├── middleware/   # Auth, CORS, logging, validation
├── models/       # Repository pattern (User, Storefront, Service, ScheduleRule, Drop, Appointment)
├── routes/       # API endpoints (auth, storefronts, services, schedule-rules, drops, availability, appointments, marketplace)
├── services/     # Business logic (UserService, StorefrontService, ServiceService, DropService, AvailabilityService, AppointmentService, MarketplaceService)
├── types/        # TypeScript interfaces and API response types
└── utils/        # JWT, bcrypt, password validation helpers

frontend/src/
├── components/
│   ├── ui/       # shadcn/ui wrapped components
│   ├── universal/ # V3 design system (UniversalButton, UniversalCard)
│   ├── booking/  # Client booking flow (BookingModal + wizard steps, PortfolioCard, ProfileHeader, DropCard)
│   ├── layout/   # AppScaffold, Header
│   └── vendor/   # Vendor management (StorefrontFormModal, ServiceManager, HoursManager, DropsTab, DropFormModal)
├── hooks/        # useAuth, useStorefronts, useServices, useScheduleRules, useDrops, useAvailability, useAppointments, useMarketplace
├── pages/        # Route-level components (auth/, vendor/, VendorProfilePage.tsx)
├── services/     # Axios API client with JWT interceptor
├── stores/       # Zustand (UI, Calendar state)
└── App.tsx       # React Router v7 with protected routes
```

### Technology Stack

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

### Key Architecture Patterns

**Backend:** Routes → Services (business logic) → Models (repository/SQL) → PostgreSQL

**Frontend:** Zustand (UI state) → Custom Hooks (wrap React Query) → Components

**Auth flow:** Login → JWT stored in localStorage → Axios interceptor injects `Authorization: Bearer <token>` on every request → backend middleware verifies and attaches `req.user`

**API response wrapper** (all endpoints):
```typescript
{ success: boolean, data: T | null, message: string }
```

### Frontend Patterns

**State management:**
- Server state (API data) → React Query `useQuery`/`useMutation`
- UI state (modals, filters) → Zustand stores
- Form state → React Hook Form + Zod
- Multi-step wizard state → component-local `useState` (e.g., BookingModal)

**Booking Modal (4-step wizard pattern):** Service → Date/Time → Confirm → Success
- Local state over Zustand (self-contained flow)
- Pre-selection support (skip step 1 if service already chosen)
- Drop pre-selection support (`preSelectedDropId` prop, passes `drop_id` to appointment API)
- Drop service filtering (`dropServiceId` prop filters step 1 to only the drop's linked service)
- Auth check deferred until final confirmation step
- Address input only shown for mobile/hybrid vendors

**Available Custom Hooks:**
- `useAuth()` - login, logout, token, user info
- `useStorefronts()` - CRUD with mutations
- `useServices()` - per-storefront CRUD
- `useScheduleRules()` - availability patterns CRUD
- `useDrops(storefrontId)` / `usePublicDrops(storefrontId)` - vendor drops CRUD + public listing
- `useAvailability(storefrontId, serviceId, startDate, endDate)` - available slots in YYYY-MM-DD range, timezone-aware
- `useAppointments()` / `useStorefrontAppointments(id)` / `useClientAppointments()` - with confirm/cancel/complete mutations
- `useCreateAppointment()` - race-condition-safe booking
- `useMarketplace()` / `usePublicStorefront(id)` - public, no auth required

**Navigation:** All pages must include `<Header />` at the top.

**Styling:** TailwindCSS utility classes only (no CSS files). Use `clsx` for conditionals.

### Database Schema

**Core tables:** `users`, `storefronts`, `services`, `schedule_rules`, `drops`, `appointments`, `appointment_slots`

**Key storefront fields:**
- `profile_type`: `individual` | `business`
- `location_type`: `fixed` | `mobile` | `hybrid`
- `service_radius`, `service_area_city` (mobile/hybrid)
- `latitude`, `longitude`, `city`, `state` (geolocation)
- `avatar_url`, `is_verified` (admin-only), `layout_mode`, `theme_color`, `instagram_handle`

**Key drops fields:**
- `title`, `description`, `drop_date`, `start_time`, `end_time`
- `service_id` (nullable — null = all services)
- `max_concurrent_appointments`, `is_published`, `is_active`
- Soft delete via `deleted_at`
- Integrated into AvailabilityService as priority-100 TimeBlocks (override all rules)

**Key appointment fields:** `service_location_type` (`at_vendor`/`at_client`), `client_address`, `drop_id` (nullable FK)

**Appointment statuses:** `pending` → `confirmed` → `completed` | `cancelled` | `declined`

**Migrations (apply in order):**
```bash
psql -d schedulux_primary -f backend/migrations/004_clean_schema.sql
psql -d schedulux_primary -f backend/migrations/005_marketplace_pivot.sql
psql -d schedulux_primary -f backend/migrations/006_add_declined_status.sql
psql -d schedulux_primary -f backend/migrations/007_add_geolocation.sql
psql -d schedulux_primary -f backend/migrations/008_visual_portfolio.sql
psql -d schedulux_primary -f backend/migrations/009_add_drops.sql
```

**Drop API endpoints:**
- `POST /api/storefronts/:id/drops` - create (auth required)
- `GET /api/storefronts/:id/drops` - list all (auth required, vendor)
- `GET /api/storefronts/:id/drops/public` - list published future drops (no auth)
- `GET /api/drops/:id` - get by ID (auth required)
- `PUT /api/drops/:id` - update (auth required)
- `DELETE /api/drops/:id` - soft delete (auth required)

**Public marketplace endpoints (no auth):**
- `GET /api/marketplace/search` - geographic + text + filter search with pagination
- `GET /api/marketplace/storefronts/:id` - storefront detail with services

## Guidelines

### Frontend
- React Query for server state — don't put API responses in Zustand
- Form validation: define Zod schema, use `zodResolver` with React Hook Form
- Use parameterized SQL only — never string-concatenate user input

### Backend
- Wrap all route handlers in try-catch, return consistent `ApiResponse`
- Never expose internal error details to client
- Avoid N+1 queries; use `LIMIT`/`OFFSET` for pagination
- `is_verified` is admin-only — cannot be set by vendors via API

### Adding a new API endpoint
1. Model method (`models/*.ts`) with parameterized SQL
2. Service method (`services/*.ts`) with business logic
3. Route handler (`routes/*.ts`) with express-validator + try-catch
4. Register in `backend/src/index.ts`
5. Frontend hook (`hooks/*.ts`) wrapping React Query
6. Component + page + route in `App.tsx`

### Debugging
- Backend: console shows 🟢/🔴 per request with duration
- Frontend: React Query DevTools (floating button, bottom-right)
- Auth: `localStorage.getItem('authToken')` in browser console
- API test: `curl -H "Authorization: Bearer <token>" http://localhost:3000/api/path`

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

## What's Left to Build
- Client appointment management page (view, cancel, reschedule)
- Marketplace homepage / storefront discovery listing
- Booking state restoration after login redirect (sessionStorage integration)
- Email notifications for appointments
- Admin dashboard
