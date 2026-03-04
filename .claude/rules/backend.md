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

## Adding a New API Endpoint

1. Model method (`models/*.ts`) with parameterized SQL
2. Service method (`services/*.ts`) with business logic
3. Route handler (`routes/*.ts`) with express-validator + try-catch
4. Register in `backend/src/index.ts`
5. Frontend hook (`hooks/*.ts`) wrapping React Query
6. Component + page + route in `App.tsx`

## Database Schema

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

**`findByClientId()` JOINs** `services` and `storefronts` to return `service_name` and `storefront_name` alongside each appointment row.

## Migrations (apply in order)

```bash
psql -d schedulux_primary -f backend/migrations/004_clean_schema.sql
psql -d schedulux_primary -f backend/migrations/005_marketplace_pivot.sql
psql -d schedulux_primary -f backend/migrations/006_add_declined_status.sql
psql -d schedulux_primary -f backend/migrations/007_add_geolocation.sql
psql -d schedulux_primary -f backend/migrations/008_visual_portfolio.sql
psql -d schedulux_primary -f backend/migrations/009_add_drops.sql
```

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

## Debugging

- Console shows 🟢/🔴 per request with duration
- API test: `curl -H "Authorization: Bearer <token>" http://localhost:3000/api/path`
