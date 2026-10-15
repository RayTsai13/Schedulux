# Backend Rules

## Architecture

**Pattern:** Routes → Services (business logic) → Models (repository/SQL) → PostgreSQL

**Availability:** `services/AvailabilityService.ts` is a thin DB adapter around `@schedulux/availability-engine` (`packages/availability-engine`). Priority resolution, DST handling, and slot generation live in the engine. Change behavior there (with engine tests), not in the adapter.

**Auth:**
- **Vendors** sign in: Login → JWT in localStorage → Axios interceptor sends `Authorization: Bearer <token>` → `authenticateToken` attaches `req.user`. Registration always creates `role: 'vendor'`; login rejects legacy `client`/`admin` rows with a 403.
- **Guests** have no accounts. Each appointment has a 256-bit hex `manage_token`, returned on booking and emailed. Possession authorizes `/api/bookings/:token/*`. Unknown tokens get the same 404 as missing rows.

**API response wrapper** (all endpoints):
```typescript
{ success: boolean, data: T | null, message: string }
```

## Guidelines

- Wrap all route handlers in try-catch, return consistent `ApiResponse`
- Never expose internal error details to client
- Avoid N+1 queries; use `LIMIT`/`OFFSET` for pagination
- Use parameterized SQL only — never string-concatenate user input. `StorefrontModel.update` builds SET clauses from object keys, so services must whitelist keys (`UPDATABLE_STOREFRONT_FIELDS`)
- Email calls are fire-and-forget — never `await` them, never throw on email failure. Escape user-supplied text in templates with `esc()`
- **Booking writes:** load context (`AvailabilityService.loadSlotContext`) *before* taking a connection, then `BEGIN` → `pg_advisory_xact_lock(41001, storefrontId)` → count overlaps with `countOverlappingAppointmentsWithClient(client, …)` → `evaluateSlot` → insert. Don't make pool queries while holding the lock (that caused pool starvation under load)
- One storefront ("page") per vendor, enforced in `StorefrontService.create`
- Rate limiting: `authLimiter` (10/15min, POSTs only) on `/api/auth/*`, `bookingLimiter` (10/15min) on public booking/waitlist writes, `apiLimiter` (100/15min) on `/api/*`

## Adding a New API Endpoint

1. Model method (`models/*.ts`) with parameterized SQL
2. Service method (`services/*.ts`) with business logic
3. Route handler (`routes/*.ts`) with express-validator + try-catch
4. Register in `backend/src/index.ts`
5. Frontend hook (`hooks/*.ts`) wrapping React Query
6. Component + page + route in `App.tsx`

## Database Schema

**Core tables:** `users`, `storefronts`, `services`, `schedule_rules`, `drops`, `drop_waitlist`, `appointments`, `password_reset_tokens`

**Key storefront fields:** `slug` (unique, `^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$`; reserved words in `RESERVED_SLUGS`), `name`, `description`, `address`, `city`, `state`, `timezone`, `avatar_url`, `theme_color`, `instagram_handle`, `is_active`

**Key drops fields:** `title`, `description`, `drop_date`, `start_time`, `end_time`, `service_id` (nullable = all services), `max_concurrent_appointments` (per slot), `is_published`, `is_active`, soft delete via `deleted_at`. Drops are engine *windows* at priority 100 (override all rules, including closures).

**Drop spots:** `DropService.countSpots` = slots in the window (sized by the drop's service, or the shortest active service) × capacity; remaining subtracts overlapping bookings across all services. One bookings query for all drops.

**`drop_waitlist`:** `(drop_id, name, email, notified_at)`, unique on `(drop_id, lower(email))`. Joining is allowed only when `remaining_spots = 0`. On any cancel/decline of a drop booking (or a reschedule out of its window), `DropService.notifyWaitlist` atomically claims un-notified rows (`UPDATE … RETURNING`) and emails them.

**Key appointment fields:** `guest_name`, `guest_email`, `guest_phone`, `manage_token`, `client_id` (legacy, nullable), `drop_id` (nullable), `requested_start_datetime`/`requested_end_datetime`

**Appointment statuses:** `pending` → `confirmed` → `completed` | `cancelled` | `declined` | `no_show`

## Migrations

In production/Docker, migrations run automatically on container startup via `npm run migrate` (`backend/src/migrate.ts`, tracks applied files in `schema_migrations`). Locally: `npm run build && npm run migrate` on a fresh database. A database whose earlier migrations were applied by hand with `psql` has no `schema_migrations` table, so the runner would re-run everything from 004; apply new files with `psql -d schedulux_primary -f backend/migrations/<file>.sql` instead.

Files, in order: `004_clean_schema.sql` … `010_password_reset_tokens.sql`, `011_drops_pivot.sql` (guest booking columns, slugs, `drop_waitlist`, drops marketplace/geo/mobile columns).

New migrations go in `backend/migrations/` with the next number prefix (e.g. `012_...sql`). Never edit existing migration files.

## Public Endpoints (no auth)

- `GET /api/pages/:slug` - storefront (public fields), active services, upcoming published drops with `total_spots`/`remaining_spots`
- `GET /api/slugs/:slug/available` - `{ available }` for onboarding
- `GET /api/storefronts/:id/availability?service_id=&start_date=&end_date=` - bookable slots (≤31 days)
- `POST /api/appointments` - guest booking (`bookingLimiter`). Body: `{ storefront_id, service_id, start_datetime, guest_name, guest_email, guest_phone?, client_notes?, drop_id? }`. Returns the appointment including `manage_token`
- `GET /api/bookings/:token` - booking for the token holder (no internal notes)
- `POST /api/bookings/:token/cancel`
- `POST /api/bookings/:token/reschedule` - body `{ start_datetime }`; atomic cancel+rebook under the page lock; the new booking gets a **new** token; returns `{ cancelled, new }`
- `POST /api/drops/:id/waitlist` - body `{ name, email }`; 409 unless sold out

## Vendor Endpoints (JWT)

- `GET /api/storefronts/mine` - the vendor's page (`data: null` until onboarding)
- `POST /api/storefronts` - create page (requires `slug`; 409 if taken or if the vendor already has one)
- `GET / PUT / DELETE /api/storefronts/:id` - owner only
- `GET / POST /api/storefronts/:id/services`, `PUT / DELETE /api/storefronts/:id/services/:serviceId`
- `GET / POST /api/storefronts/:id/rules`, `PUT / DELETE /api/storefronts/:id/rules/:ruleId`
- `GET / POST /api/storefronts/:id/drops` (GET includes spot counts and `waitlist_count`), `GET / PUT / DELETE /api/drops/:id`
- `GET /api/storefronts/:storefrontId/appointments` - includes `service_name`
- `GET /api/appointments/:id`, `PATCH /api/appointments/:id/status`, `POST /api/appointments/:id/approve`, `POST /api/appointments/:id/decline`
- `POST /api/upload/image` - Cloudinary upload (503 if unconfigured)

## Auth Endpoints

- `POST /api/auth/register` (vendor), `POST /api/auth/login`, `GET /api/auth/me`
- `POST /api/auth/forgot-password` (always 200), `POST /api/auth/reset-password`

## Email Service

**`backend/src/services/EmailService.ts`** — static methods, fire-and-forget. No-ops (logs to console) when `SENDGRID_API_KEY` is unset.

```ts
EmailService.sendWelcome(email, firstName)
EmailService.sendAppointmentConfirmation(email, { …, manageToken })   // guest, includes /manage link
EmailService.sendAppointmentStatusChange(email, { …, manageToken })   // confirmed/cancelled/declined
EmailService.sendNewBookingNotification(email, details)               // to vendor
EmailService.sendWaitlistSpotOpened(email, { name, dropTitle, storefrontName, dropUrl })
EmailService.sendPasswordReset(email, token)
pageUrl(slug, dropId?)                                                // FRONTEND_URL/@slug[/drops/id]
```

## Environment Variables

Required at runtime (app exits if missing): `JWT_SECRET`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`

Optional: `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`, `SENDGRID_FROM_NAME`, `FRONTEND_URL` (links in emails; default `http://localhost:5173`), `CLOUDINARY_*`

## Testing

- Vitest unit tests in `src/**/__tests__/*.test.ts`; `npm test` (no database needed)
- Mock the model layer with `vi.mock('../../models/<Model>')`; test services through their public static methods
- Build rows with `src/services/__tests__/fixtures.ts`
- Freeze "now" with `vi.useFakeTimers({ toFake: ['Date'] })` + `vi.setSystemTime()` (fake only `Date` when testing fire-and-forget code that awaits `setImmediate`)
- Pure scheduling logic belongs in the engine package and its tests, which run under `TZ=Europe/Berlin`
- Real Postgres behavior (advisory locks) is exercised by `npm run demo:race`, not unit tests

## Debugging

- Console shows 🟢/🔴 per request with duration; dev mode also logs every query
- Health check: `curl http://localhost:3000/health`
