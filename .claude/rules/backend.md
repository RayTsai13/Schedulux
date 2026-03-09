# Backend Rules

## Architecture

**Pattern:** Routes → Services (business logic) → Models (repository/SQL) → PostgreSQL

**Auth flow:** Login → JWT stored in localStorage → Axios interceptor injects `Authorization: Bearer <token>` → backend middleware verifies and attaches `req.user`

**API response wrapper** (all endpoints):
```typescript
{ success: boolean, data: T | null, message: string }
```

## Guidelines

- Wrap all route handlers in try-catch, return consistent `ApiResponse`
- Never expose internal error details to client
- Avoid N+1 queries; use `LIMIT`/`OFFSET` for pagination
- Use parameterized SQL only — never string-concatenate user input
- `is_verified` is admin-only — cannot be set by vendors via API
- Email calls are fire-and-forget — never `await` them, never throw on email failure
- Rate limiting: `authLimiter` (10/15min) on `/api/auth/*`, `apiLimiter` (100/15min) on `/api/*`

## Adding a New API Endpoint

1. Model method (`models/*.ts`) with parameterized SQL
2. Service method (`services/*.ts`) with business logic
3. Route handler (`routes/*.ts`) with express-validator + try-catch
4. Register in `backend/src/index.ts`
5. Frontend hook (`hooks/*.ts`) wrapping React Query
6. Component + page + route in `App.tsx`

## Database Schema

**Core tables:** `users`, `storefronts`, `services`, `schedule_rules`, `drops`, `appointments`, `appointment_slots`, `password_reset_tokens`

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

**`findByClientId()` JOINs** `services` and `storefronts` to return `service_name` and `storefront_name` alongside each appointment row.

## Migrations

In production/Docker, migrations run automatically on container startup via `npm run migrate` (`backend/src/migrate.ts`).

For manual application (in order):
```bash
psql -d schedulux_primary -f backend/migrations/004_clean_schema.sql
psql -d schedulux_primary -f backend/migrations/005_marketplace_pivot.sql
psql -d schedulux_primary -f backend/migrations/006_add_declined_status.sql
psql -d schedulux_primary -f backend/migrations/007_add_geolocation.sql
psql -d schedulux_primary -f backend/migrations/008_visual_portfolio.sql
psql -d schedulux_primary -f backend/migrations/009_add_drops.sql
psql -d schedulux_primary -f backend/migrations/010_password_reset_tokens.sql
```

New migrations go in `backend/migrations/` with the next number prefix (e.g. `011_...sql`). Never edit existing migration files.

## Storefront & Service API Endpoints

- `GET /api/storefronts` - vendor's own storefronts (auth required, vendor)
- `POST /api/storefronts` - create storefront (auth required, vendor)
- `GET /api/storefronts/:id` - get storefront (auth required)
- `PUT /api/storefronts/:id` - update storefront (auth required, owner)
- `DELETE /api/storefronts/:id` - soft delete (auth required, owner)
- `GET /api/storefronts/:id/services` - list services (auth required)
- `POST /api/storefronts/:id/services` - create service (auth required, owner)
- `PUT /api/storefronts/:id/services/:serviceId` - update service (auth required, owner)
- `DELETE /api/storefronts/:id/services/:serviceId` - soft delete service (auth required, owner)
- `GET /api/storefronts/:id/rules` - list schedule rules (auth required)
- `POST /api/storefronts/:id/rules` - create schedule rule (auth required, owner)
- `PUT /api/storefronts/:id/rules/:ruleId` - update rule (auth required, owner)
- `DELETE /api/storefronts/:id/rules/:ruleId` - delete rule (auth required, owner)
- `GET /api/availability?storefront_id=&service_id=&start_date=&end_date=` - available slots (no auth)

## Image Upload Endpoint

- `POST /api/upload/service-image` - upload image to Cloudinary (auth required, vendor)
  - Content-Type: `multipart/form-data`, field name: `image`
  - Max size: 5MB
  - Returns: `{ url: string, public_id: string }`
  - Gracefully returns 503 if `CLOUDINARY_CLOUD_NAME` is not configured

## Drop API Endpoints

- `POST /api/storefronts/:id/drops` - create (auth required)
- `GET /api/storefronts/:id/drops` - list all (auth required, vendor)
- `GET /api/storefronts/:id/drops/public` - list published future drops (no auth)
- `GET /api/drops/:id` - get by ID (auth required)
- `PUT /api/drops/:id` - update (auth required)
- `DELETE /api/drops/:id` - soft delete (auth required)

## Appointment API Endpoints

- `POST /api/appointments` - create booking (auth required, client)
- `GET /api/appointments` - list client's own appointments (auth required)
- `GET /api/appointments/:id` - get single appointment (auth required, owner or vendor)
- `PATCH /api/appointments/:id/status` - update status (auth required)
- `POST /api/appointments/:id/reschedule` - atomic cancel+rebook (auth required, client only)
  - Body: `{ start_datetime: string }` (ISO 8601)
  - Returns: `{ cancelled: Appointment, new: Appointment }`
  - Uses advisory lock — rolls back if new slot unavailable
- `POST /api/appointments/:id/approve` - vendor approval (auth required, vendor)
- `POST /api/appointments/:id/decline` - vendor decline (auth required, vendor)
- `GET /api/storefronts/:storefrontId/appointments` - storefront appointments (auth required, vendor)

## Public Marketplace Endpoints (no auth)

- `GET /api/marketplace/search` - geographic + text + filter search with pagination
- `GET /api/marketplace/storefronts/:id` - storefront detail with services

## Admin API Endpoints

- `GET /api/admin/stats` - platform stats (auth + admin role required)
- `GET /api/admin/storefronts?limit=20&offset=0` - paginated storefront list with vendor info
- `PATCH /api/admin/storefronts/:id/verify` - body: `{ is_verified: boolean }`

## Auth API Endpoints

- `POST /api/auth/register` - create account
- `POST /api/auth/login` - login
- `GET /api/auth/me` - current user profile
- `POST /api/auth/forgot-password` - send reset email (always 200, no user enumeration)
- `POST /api/auth/reset-password` - body: `{ token, password }` — updates password

## Email Service

**`backend/src/services/EmailService.ts`** — static methods, fire-and-forget pattern:

```ts
EmailService.sendWelcome(email, firstName)
EmailService.sendAppointmentConfirmation(email, details)
EmailService.sendAppointmentStatusChange(email, details)   // confirmed/cancelled/declined
EmailService.sendNewBookingNotification(email, details)    // to vendor
EmailService.sendPasswordReset(email, token)               // link: FRONTEND_URL/reset-password?token=
```

No-ops gracefully when `SENDGRID_API_KEY` is unset (logs to console instead).

## Rate Limiting

**`backend/src/middleware/rateLimiter.ts`**:
- `authLimiter` — 10 req / 15 min per IP, applied to `/api/auth/*`
- `apiLimiter` — 100 req / 15 min per IP, applied to `/api/*`

## Environment Variables

Required at runtime (app exits if missing):
- `JWT_SECRET` — signs and verifies JWTs
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` — PostgreSQL connection

Optional (features degrade gracefully if unset):
- `SENDGRID_API_KEY` — emails log to console if missing
- `SENDGRID_FROM_EMAIL`, `SENDGRID_FROM_NAME` — email sender identity
- `FRONTEND_URL` — used in password reset email links (defaults to `http://localhost:5173`)
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — image uploads return 503 if missing

## Debugging

- Console shows 🟢/🔴 per request with duration
- API test: `curl -H "Authorization: Bearer <token>" http://localhost:3000/api/path`
- Health check: `curl http://localhost:3000/health` (returns DB connectivity status)
