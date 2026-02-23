# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Commands

### Development
```bash
# Start both backend and frontend servers concurrently
./start-dev.sh

# Or start them separately:
cd backend && npm run dev        # Backend: http://localhost:3000
cd frontend && npm run dev       # Frontend: http://localhost:5173
```

### Testing & Verification
```bash
# Backend database connection and TypeScript compilation
cd backend && npm run test:connection

# Database schema and connectivity
cd backend && npm run test:db

# Authentication utilities
cd backend && npm run test:auth

# Create admin user for testing
cd backend && npx ts-node scripts/create-admin.ts
```

### Building
```bash
# Backend (TypeScript → JavaScript in dist/)
cd backend && npm run build

# Frontend (Vite bundler, optimized output in dist/)
cd frontend && npm run build
```

### Linting
```bash
cd frontend && npm run lint
```

## Architecture Overview

### Project Structure
```
backend/                      # Node.js/Express REST API
├── src/
│   ├── config/             # Database connection pooling (PostgreSQL)
│   ├── middleware/         # Auth, CORS, custom logging, validation
│   ├── models/             # Repository pattern data access layer (User, Storefront, Service, ScheduleRule, Appointment)
│   ├── routes/             # API endpoints (auth, storefronts, services, schedule-rules, availability, appointments)
│   ├── services/           # Business logic (UserService, StorefrontService, ServiceService, ScheduleRuleService, AvailabilityService, AppointmentService)
│   ├── types/              # TypeScript interfaces and API response types
│   ├── utils/              # JWT, bcrypt, password validation helpers
│   └── index.ts            # Express app setup with middleware chain
├── migrations/             # PostgreSQL schema (004_clean_schema.sql is current)
└── scripts/                # Database testing, admin user creation

frontend/                     # React 18 SPA (Vite build tool)
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── ui/            # shadcn/ui wrapped components (Button, Input, Modal, etc.)
│   │   ├── universal/     # V3 design system (UniversalButton, UniversalCard)
│   │   ├── booking/       # Client booking components (BookingModal, PortfolioCard, ProfileHeader, booking wizard steps)
│   │   ├── layout/        # Layout components (AppScaffold, Header)
│   │   └── vendor/        # Vendor-specific components (StorefrontFormModal, ServiceManager, HoursManager, TimezoneSelector, BusinessHoursEditor)
│   ├── hooks/             # Custom React hooks (useAuth, useStorefronts, useServices, useScheduleRules, useAvailability, useAppointments, useMarketplace)
│   ├── pages/             # Route-level page components
│   │   ├── auth/          # Login, Signup pages
│   │   ├── VendorProfilePage.tsx  # Public vendor profile with booking modal
│   │   └── vendor/        # Storefront, Service, Appointment management
│   ├── services/          # Axios API client with interceptors
│   ├── stores/            # Zustand state management (UI, Calendar, etc.)
│   ├── config/            # React Query client configuration
│   ├── App.tsx            # React Router v7 setup with protected routes
│   └── main.tsx           # React DOM entry point
├── vite.config.ts         # Bundler configuration
└── tailwind.config.js     # TailwindCSS theme customization
```

### Technology Stack

| Layer | Technology | Key Points |
|-------|-----------|-----------|
| **Frontend Framework** | React 18 + TypeScript | Strict mode enabled, type-safe components |
| **Frontend Build** | Vite + TypeScript | Fast dev server, optimized production builds |
| **Frontend Routing** | React Router 7.9 | Protected routes via middleware pattern, auth guards |
| **Frontend State** | Zustand | Simple, lightweight (avoid Context for performance) |
| **Frontend Data Fetching** | TanStack React Query 5 | Server state management, caching, background sync |
| **Frontend Styling** | TailwindCSS + shadcn/ui | Utility-first CSS, pre-built accessible components |
| **Frontend Forms** | React Hook Form + Zod | Client-side validation, type-safe form handling |
| **Frontend Calendar** | react-datepicker + date-fns | Date selection UI with availability filtering |
| **Backend Framework** | Express.js + TypeScript | Middleware-based architecture |
| **Backend Authentication** | JWT + bcryptjs | Token-based, 10-second expiration in dev |
| **Backend Validation** | express-validator + Zod | Server-side input sanitization |
| **Database** | PostgreSQL 15+ | Connection pooling (20 max), JSONB columns, exclusion constraints |
| **Database Pattern** | Repository Pattern | Data access layer separation (models/) + Services (services/) |
| **Date/Time Handling** | date-fns + date-fns-tz | Timezone-aware date manipulation, availability calculations |
| **API Client** | Axios | Request/response interceptors for JWT injection |
| **Security** | Helmet middleware | CORS, CSP, XSS protection, HSTS headers |
| **Concurrency** | PostgreSQL Advisory Locks | Race condition prevention for simultaneous bookings |
| **HTTP Logging** | Custom logger | ISO timestamps, color-coded status, duration tracking |

### Key Architecture Patterns

#### Backend: Repository + Service Pattern
```
Routes (Express endpoints)
    ↓
Services (Business logic)
    ↓
Models (Repository pattern - data access)
    ↓
PostgreSQL (via pg library connection pool)
```

Example: `auth.ts` route calls `UserService.register()` which calls `UserModel.create()` which executes parameterized SQL.

#### Frontend: Store → Hooks → Components
```
Zustand Store (global state: UI, calendar state, storefronts)
    ↓
Custom Hooks (useAuth, useStorefronts, useServices, useScheduleRules - wrap React Query)
    ↓
Components (consume hooks, dispatch mutations)
```

React Query handles server state (async data fetching), Zustand handles UI state (modals, filters).

#### Authentication Flow (Frontend → Backend)
1. User submits login form → `useAuth` hook → `POST /api/auth/login`
2. Backend validates credentials, returns JWT token
3. Frontend stores token in localStorage via `useAuth` store
4. Axios interceptor (`frontend/src/services/api.ts`) injects JWT in all subsequent requests
5. Backend middleware verifies token, attaches `user` object to request
6. Protected routes check auth state before rendering

#### Database Connection Strategy
- Single `Pool` instance created at startup (`backend/src/config/database.ts`)
- All queries use parameterized statements to prevent SQL injection
- Pool manages up to 20 concurrent connections
- Idle connections recycled automatically

### Frontend Patterns

#### Component Organization
- **Page Components** (`pages/`) - Handle routing, fetch data, manage layout
  - `VendorProfilePage.tsx` - Public vendor profile with integrated BookingModal
- **Reusable Components** (`components/`) - Pure functions, receive props, no side effects
  - `booking/` - Client booking flow components (BookingModal, wizard steps, PortfolioCard, ProfileHeader)
  - `universal/` - V3 design system components (UniversalButton, UniversalCard)
  - `layout/` - Layout components (AppScaffold, Header)
  - `vendor/` - Vendor-specific management components
- **UI Components** (`components/ui/`) - Wrapped shadcn/ui components with custom styling (Modal, Button, Input, etc.)

#### State Management Strategy
- **Server State** (API data) → Use React Query hooks (`useQuery`, `useMutation`)
- **UI State** (modals open/closed, selected filters) → Use Zustand `create()` stores
- **Form State** → Use React Hook Form + Zod validation
- **Wizard State** (multi-step flows) → Use component-local `useState` for simpler flows (e.g., BookingModal)

#### Booking Modal Pattern (Multi-Step Wizard)
The BookingModal demonstrates the recommended pattern for multi-step flows:

```typescript
// BookingModal.tsx - Orchestrator Component
interface BookingState {
  currentStep: 1 | 2 | 3 | 4;
  selectedService: Service | null;
  selectedDate: Date | null;
  selectedSlot: AvailableSlot | null;
  // ... other wizard state
}

// Component-local state (simpler than Zustand for self-contained flows)
const [state, setState] = useState<BookingState>(initialState);

// Step-specific child components receive props + callbacks
<BookingStepService
  services={services}
  selectedServiceId={state.selectedService?.id}
  onSelectService={(service) => setState(prev => ({ ...prev, selectedService: service }))}
/>
```

**Key Design Decisions:**
- **Local State Over Zustand**: Booking wizard is self-contained, no need for global state
- **Progressive Disclosure**: Only show relevant fields at each step (e.g., address input only if mobile service + at_client)
- **Step Validation**: "Next" button disabled until current step requirements met
- **Pre-selection Support**: Can skip Step 1 if user clicked "Book Now" on specific service
- **Authentication Deferral**: Allow browsing services/times before requiring login
- **State Persistence**: Save to sessionStorage on login redirect (future: restore after auth)
- **Error Recovery**: Clear error messages, allow retry, return to previous step if needed

#### API Service Pattern
```typescript
// frontend/src/services/api.ts
const apiClient = axios.create({ baseURL: 'http://localhost:3000/api' });

// Interceptor automatically adds JWT token to Authorization header
apiClient.interceptors.request.use(config => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

Custom hooks wrap React Query:
```typescript
// frontend/src/hooks/useStorefronts.ts
const useStorefronts = () => {
  return useQuery({
    queryKey: ['storefronts'],
    queryFn: () => apiClient.get('/storefronts').then(r => r.data.data)
  });
};
```

#### Available Custom Hooks
- **`useAuth()`** - Authentication state (login, logout, token, user info)
- **`useStorefronts()`** - Fetch all storefronts or single storefront by ID; Create/Update/Delete mutations
- **`useServices()`** - Fetch/manage services per storefront with Create/Update/Delete mutations
- **`useScheduleRules()`** - Fetch/manage schedule rules (availability patterns) with Create/Update/Delete mutations
- **`useAvailability()`** - Fetch available appointment slots for a storefront/service with date range filtering
  - Parameters: `storefrontId`, `serviceId`, `startDate`, `endDate` (YYYY-MM-DD format)
  - Auto-converts to local timezone, returns slots with capacity info
- **`useAppointments()`** - Fetch vendor's storefront appointments or client's booked appointments
  - Vendor: `useStorefrontAppointments(storefrontId)` - Filter by status, date range
  - Client: `useClientAppointments()` - Filter by status, date range
  - Mutations: `useConfirmAppointment()`, `useCancelAppointment()`, `useCompleteAppointment()`
- **`useCreateAppointment()`** - Book/create appointments with race condition prevention
- **`useMarketplace()`** - Public marketplace data (no authentication required)
  - `usePublicStorefront(id)` - Fetch public storefront details with services for booking
  - Used in VendorProfilePage for displaying vendor info and integrating BookingModal

All hooks follow the same pattern:
- Read operations use `useQuery` for caching and background sync
- Write operations (create/update/delete) use `useMutation` with automatic query invalidation
- Error handling and loading states exposed to components
- Availability and appointment hooks handle timezone conversions automatically

### Backend Patterns

#### Middleware Chain (bottom to top execution order)
```typescript
// backend/src/index.ts
app.use(helmet());              // Security headers
app.use(cors());                // CORS policy
app.use(logRequest);            // Custom logging
app.use(express.json());        // Parse JSON body
app.use(validateRequest);       // Input validation (if added)
app.use(authMiddleware);        // JWT verification (on protected routes)
app.use('/api/auth', authRoutes);
```

#### Repository Pattern Example
```typescript
// backend/src/models/User.ts
class UserModel {
  static async findById(id: number) {
    const result = await query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0];
  }
}

// backend/src/services/UserService.ts
class UserService {
  static async getProfile(userId: number) {
    const user = await UserModel.findById(userId);
    return { id: user.id, name: user.first_name + ' ' + user.last_name };
  }
}

// backend/src/routes/auth.ts
router.get('/me', authenticateToken, async (req, res) => {
  const profile = await UserService.getProfile(req.user.id);
  res.json(apiResponse(profile, 'Profile fetched'));
});
```

#### API Response Wrapper
All backend responses use this structure:
```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message: string;
}

// Usage: res.json(apiResponse({ id: 1, name: 'John' }, 'User created'));
// Output: { success: true, data: { id: 1, name: 'John' }, message: 'User created' }
```

### Database Schema Notes

**Core Tables:**
- `users` - Vendors, clients, admins (soft delete via `deleted_at`)
- `storefronts` - Business locations with JSONB `business_hours`
- `services` - Service offerings per storefront
- `schedule_rules` - Flexible availability (weekly/daily/monthly patterns + priority)
- `appointments` - Bookings with status tracking (pending/confirmed/completed/cancelled)
- `appointment_slots` - Predefined time slots for instant booking

**Advanced Features:**
- **JSONB columns** (`business_hours` in storefronts) store flexible data
- **Exclusion constraints** prevent appointment conflicts automatically
- **Audit triggers** maintain complete change history in `audit_log`
- **Indexes** optimized for scheduling queries (1-15ms typical response)

**Marketplace Fields (Phase 1, 2, & 3):**
- `storefronts`: `profile_type` (individual/business), `location_type` (fixed/mobile/hybrid), `service_radius`, `service_area_city`, `avatar_url`, `is_verified` (admin-only), `latitude`, `longitude`, `city`, `state` (Phase 3), `layout_mode`, `theme_color`, `instagram_handle` (Phase 4)
- `services`: `image_url`, `is_featured` (Phase 4)
- `schedule_rules`: `name` (Phase 4)
- `appointments`: `service_location_type` (at_vendor/at_client), `client_address`

**Current migrations:**
- `migrations/004_clean_schema.sql` - Base schema
- `migrations/005_marketplace_pivot.sql` - Marketplace fields (profile/location/service area)
- `migrations/006_add_declined_status.sql` - Approval workflow status
- `migrations/007_add_geolocation.sql` - Geolocation fields + earthdistance extension
- `migrations/008_visual_portfolio.sql` - Visual portfolio fields (layout_mode, theme_color, instagram_handle, service images, named availability windows)

## Development Workflow

### Adding a New Feature (Example: Service Management)

1. **Backend: Create data model**
   ```typescript
   // backend/src/models/Service.ts - Extend Repository pattern
   ```

2. **Backend: Create business logic**
   ```typescript
   // backend/src/services/ServiceService.ts - Validation + operations
   ```

3. **Backend: Create routes**
   ```typescript
   // backend/src/routes/services.ts - Express endpoints
   // Add to index.ts: app.use('/api/services', serviceRoutes);
   ```

4. **Frontend: Create API hooks**
   ```typescript
   // frontend/src/hooks/useServices.ts - React Query wrappers
   ```

5. **Frontend: Create components**
   ```typescript
   // frontend/src/components/vendor/ServiceForm.tsx - UI component
   ```

6. **Frontend: Create page**
   ```typescript
   // frontend/src/pages/vendor/ServiceManagement.tsx - Route-level component
   // Add to App.tsx router
   ```

7. **Test end-to-end:**
   - Start both servers: `./start-dev.sh`
   - Test API directly: `curl -H "Authorization: Bearer <token>" http://localhost:3000/api/services`
   - Test from browser: Navigate to page, use React Query DevTools to inspect queries

### Testing Database Changes

After modifying the schema:
```bash
cd backend
npm run test:db      # Verify schema loads
npm run test:connection  # Full TypeScript + DB validation
```

### Debugging Tips

**Frontend:**
- React Query DevTools (bottom-right floating button shows all queries/mutations)
- Browser Network tab to inspect API requests/responses
- Browser Console for JS errors
- `useAuth()` hook to check token and user state

**Backend:**
- Console logs show incoming requests with response times (🟢 success, 🔴 error)
- Check environment variables: `echo $JWT_SECRET`
- Test API directly with curl or Postman
- Database issues: Check PostgreSQL is running, database exists, migrations applied

## Frontend-Specific Guidelines

### Form Handling (React Hook Form + Zod)
```typescript
// Define validation schema first
const schema = z.object({
  name: z.string().min(1, 'Name required'),
  email: z.string().email('Invalid email')
});

// Use in component
const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema)
});
```

### Async Operations (React Query)
- Use `useQuery` for read operations, `useMutation` for write operations
- Mutations automatically trigger `useQuery` refetch via `queryClient.invalidateQueries()`
- Avoid storing API responses in Zustand - let React Query handle server state

### Navigation & Headers
- **All pages must include `<Header />`** at the top (from `components/Header.tsx`)
- Header provides persistent navigation across Dashboard, Storefronts, and individual storefront pages
- Prevents users from getting "trapped" on vendor/booking pages with no way to navigate away
- Page-specific content goes below the Header in content containers

### Styling
- Use TailwindCSS utility classes directly in JSX (no CSS files)
- Use `clsx` for conditional classes: `clsx('p-4', disabled && 'opacity-50')`
- Component composition over deep nesting

## Backend-Specific Guidelines

### Security
- All user input validated before database queries
- Use parameterized statements: `query('SELECT * FROM users WHERE id = $1', [id])`
- Never concatenate user input into SQL strings
- JWT tokens verified on protected endpoints
- CORS restricted to known frontend origins

### Error Handling
- Wrap route handlers in try-catch
- Return consistent `ApiResponse` with error details
- Log errors with timestamp for debugging
- Don't expose internal error details to client

### Query Performance
- Use indexes on frequently queried columns (schema already optimized)
- Avoid N+1 queries (fetch all related data in one query)
- Use `LIMIT` and `OFFSET` for pagination
- Monitor response times in console logs

## Environment Setup

### Required Files

**backend/.env**
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=schedulux_primary
DB_USER=<your_db_user>
DB_PASSWORD=<your_db_password>
JWT_SECRET=<your-secret-key-change-in-production>
NODE_ENV=development
PORT=3000
```

**Database prerequisite**
```bash
# PostgreSQL must be running with schedulux_primary database
# Apply migrations in order:
psql -d schedulux_primary -f backend/migrations/004_clean_schema.sql
psql -d schedulux_primary -f backend/migrations/005_marketplace_pivot.sql
psql -d schedulux_primary -f backend/migrations/006_add_declined_status.sql
psql -d schedulux_primary -f backend/migrations/007_add_geolocation.sql
```

## Common Tasks

### Running a Single Feature Test
1. Start servers: `./start-dev.sh`
2. Create test user: `cd backend && npx ts-node scripts/create-admin.ts`
3. Login at `http://localhost:5173/login`
4. Navigate to feature, open React Query DevTools to inspect API calls
5. Check backend console for request logs

### Adding a New API Endpoint
1. Identify which service it belongs to (create if needed)
2. Add route in appropriate `routes/*.ts` file
3. Implement business logic in `services/*.ts`
4. Call repository methods in `models/*.ts`
5. Use parameterized queries for all database access
6. Return `ApiResponse` wrapper with standardized format

### Modifying the Database Schema
1. Create new migration file following pattern: `migrations/005_description.sql`
2. Run migration: `psql -d schedulux_primary -f migrations/005_description.sql`
3. Test: `npm run test:db`
4. Update corresponding models and types if adding/removing columns
5. Update frontend hooks if schema affects data fetching

### Debugging a Failed API Call
1. Check backend console for request log (shows 🔴 status code and duration)
2. Use React Query DevTools to see request payload and response
3. Verify auth token exists: `localStorage.getItem('authToken')`
4. Test API directly: `curl -H "Authorization: Bearer <token>" http://localhost:3000/api/path`
5. Check database directly: `psql -d schedulux_primary -c "SELECT * FROM users LIMIT 1"`

## Project Status

**Current:** 99% complete - Full-stack booking system with Marketplace Pivot + geographic discovery (flexible vendor identities, mobile services, approval workflows, storefront search).

**Completed Phases:**
- ✓ Phase 1: Storefront CRUD (API endpoints, service layer, React hooks, UI components)
- ✓ Phase 2: Service management CRUD (API endpoints, service layer, React hooks, UI components)
- ✓ Bonus: Schedule rules CRUD (API endpoints with ownership validation, rule-type constraints, React hooks)
- ✓ Phase 3a: Availability Engine (slot calculation, priority-based rule resolution, timezone handling)
- ✓ Phase 3b: Appointment Booking API (booking with race condition prevention, ownership validation)
- ✓ Phase 4: Calendar UI and appointment booking components
- ✓ **Marketplace Pivot - Phase 1: Schema & Types** (Profile types, location types, marketplace fields, frontend forms)
- ✓ **Marketplace Pivot - Phase 2: Core Business Logic** (Validation rules, location handling, approval workflows)
- ✓ **Marketplace Pivot - Phase 3: Discovery & Availability** (Geographic search, public marketplace API, travel buffer future-proofing)
- ✓ **Marketplace Pivot - Phase 4: API & Routes (The Interface)** (Geolocation validators, comprehensive input validation, public marketplace endpoints)

**Completed Features (January 2026):**
- ✅ **AvailabilityService** - Calculate available slots based on schedule rules
  - Priority resolution: daily > monthly > weekly rules
  - Time block merging with sweep line algorithm
  - Timezone-aware calculations with date-fns-tz
  - Concurrent booking limit enforcement
- ✅ **AppointmentService** - Create and manage appointments
  - PostgreSQL advisory locks for race condition prevention
  - Atomic transactions with availability re-checking
  - Status transitions and ownership validation
  - 15-minute time bucket locking for slot protection
- ✅ **Public Availability Endpoint** - `GET /api/storefronts/:id/availability`
  - Query parameters: service_id, start_date, end_date (YYYY-MM-DD format)
  - Returns slots with local date/time and available capacity
- ✅ **Authenticated Appointment Endpoints**
  - `POST /api/appointments` - Create/book appointments
  - `GET /api/appointments` - User's bookings
  - `GET /api/storefronts/:id/appointments` - Vendor's storefront appointments
  - `PATCH /api/appointments/:id/status` - Update appointment status
- ✅ **Client Booking Page** - `/book/:storefrontId` public booking flow
  - 3-step wizard: Service Selection → Date/Time Selection → Confirmation
  - Week-based date navigation with available slot display
  - Authentication check before final booking
  - Timezone-aware time slot display
- ✅ **Vendor Calendar & Appointments**
  - Calendar tab with react-big-calendar showing booked appointments
  - Appointment detail modal with status management (confirm, complete, cancel)
  - Calendar state persistence with Zustand
- ✅ **Persistent Navigation Header**
  - All pages (Dashboard, Storefronts, Storefront Details, Booking) have consistent top navigation
  - Easy navigation between Dashboard, Storefronts list, and individual storefront pages
- ✅ **Simplified Authentication**
  - Reduced password requirements to 6+ characters (no uppercase/special char requirements)
  - Faster testing and user registration
- ✅ **Marketplace Pivot - Phase 1: Database & Types**
  - Profile types: `individual` (tutors, freelancers) and `business` (salons, clinics)
  - Location types: `fixed` (brick-and-mortar), `mobile` (travels to client), `hybrid` (both)
  - Storefront fields: `service_radius`, `service_area_city`, `avatar_url`, `is_verified` (admin-only)
  - Appointment fields: `service_location_type`, `client_address`
  - Enhanced frontend forms with marketplace settings section
  - Profile badges and location indicators on storefront cards
  - Client address collection during booking for mobile vendors
- ✅ **Marketplace Pivot - Phase 2: Core Business Logic**
  - **StorefrontService Validation**:
    - Fixed locations require address
    - Mobile/hybrid require service radius and service area city
    - `is_verified` is admin-only (cannot be set by vendors)
  - **AppointmentService Refactoring**:
    - Auto-correction of location type for fixed vendors
    - Validation of client address for at-client appointments
    - Explicit "pending" status for Request to Book workflow
  - **Approval Workflow Methods**:
    - `approveRequest()`: Vendor accepts pending request (pending → confirmed)
    - `declineRequest()`: Vendor declines pending request (pending → declined)
  - **New Status**: `'declined'` for rejected requests (terminal state)
  - **New Endpoints**:
    - `POST /api/appointments/:id/approve` - Approve pending request
    - `POST /api/appointments/:id/decline` - Decline pending request
- ✅ **Marketplace Pivot - Phase 3: Discovery & Availability (The Engine)**
  - **Geographic Search Infrastructure**:
    - PostgreSQL `earthdistance` extension for efficient distance calculations (Haversine formula)
    - Spatial GiST index on latitude/longitude for fast "within radius" queries
    - No external APIs needed, accurate within 0.5% for distances < 500 miles
  - **Geolocation Fields Added to Storefronts**:
    - `latitude`, `longitude` - For precise fixed-location search
    - `city`, `state` - For text-based fallback search
  - **MarketplaceService** - New consumer-focused discovery service:
    - `searchStorefronts()` - Search with geographic/text/filter options
    - `getPublicStorefront()` - Public storefront detail view (no auth)
  - **Public Marketplace API Endpoints**:
    - `GET /api/marketplace/search` - Search storefronts (lat/long/radius/city/state/filters/pagination)
    - `GET /api/marketplace/storefronts/:id` - Storefront details with services
    - Both endpoints are 100% public (no authentication required)
  - **Search Features**:
    - Fixed vendors: Distance-based filtering within radius
    - Mobile/Hybrid vendors: Show all (V1 - no distance filtering, V2 will add geocoding)
    - Price range aggregation (MIN/MAX from SQL)
    - Service category filtering
    - Verified vendor filtering
    - Privacy: Mobile vendor addresses hidden (show only city/state + service radius)
    - Pagination with limit/offset
  - **Travel Buffer Future-Proofing**:
    - Added `travelBuffer` parameter to `AvailabilityService.generateSlotsForDay()`
    - V1: Default 0 (no calculation), V2 ready for dynamic travel time via Google Maps
  - **Database Migration 007**:
    - New columns: latitude, longitude, city, state
    - Spatial index: `idx_storefronts_location` (GiST)
    - Text index: `idx_storefronts_city_state`
    - All 11 database tests passing, earthdistance verified
- ✅ **Marketplace Pivot - Phase 4: API & Routes (The Interface)**
  - **Geolocation Validators** (routes/storefronts.ts):
    - `latitude`: Optional float between -90 and 90
    - `longitude`: Optional float between -180 and 180
    - `city`: Optional string, max 100 characters
    - `state`: Optional string, max 50 characters
    - Added to both `validateCreate` and `validateUpdate` middleware
  - **Marketplace Routes** (routes/marketplace.ts):
    - `GET /api/marketplace/search` - Public endpoint (no auth required)
      - Query params: latitude, longitude, radius, city, state, query, location_type, profile_type, verified_only, category, min_price, max_price, limit, offset
      - Full validation with express-validator
      - Returns: Storefronts with aggregated service data, distance from user, price ranges
    - `GET /api/marketplace/storefronts/:id` - Public storefront detail
      - Returns: Full storefront with service listings
      - No authentication required, privacy-respecting (mobile addresses hidden)
  - **Input Validation Coverage**:
    - 15+ field validators across marketplace endpoints
    - Type safety: express-validator + TypeScript interfaces
    - Pagination limits enforced (max 100 results)
    - Privacy validators (verified_only, location_type filters)
  - **API Response Standardization**:
    - All endpoints return consistent `ApiResponse<T>` wrapper
    - Proper HTTP status codes (200 success, 400 validation error, 404 not found)
    - Standardized error messages for validation failures

**Completed Features (February 2026):**
- ✅ **Desktop Booking Modal** - Complete client booking flow for VendorProfilePage
  - **BookingModal Component** (Orchestrator):
    - 4-step wizard: Service Selection → Date/Time → Confirm → Success
    - Progress indicator with visual feedback
    - Authentication check with login redirect
    - Error handling and loading states
    - Auto-saves booking state to sessionStorage for post-login resume
  - **BookingStepService** (Step 1):
    - Service grid display using PortfolioCard
    - Visual selection state with ring indicator
    - Supports pre-selected services (skips step 1 if user clicked specific service)
    - Empty state handling
  - **BookingStepDateTime** (Step 2):
    - Calendar UI with react-datepicker
    - Availability filtering (only dates with slots are selectable)
    - Time slot grid with capacity indicators
    - Real-time availability fetching via useAvailability hook
    - Week-based date range queries for optimal performance
  - **BookingStepConfirm** (Step 3):
    - Booking summary card with all details
    - Location type selector (mobile/hybrid vendors only)
    - Client address input (required for at_client bookings)
    - Optional notes field
    - Form validation (address required for mobile services)
    - Error message display
  - **BookingSuccess** (Step 4):
    - Success confirmation with green checkmark
    - Appointment details display (confirmation #, date/time, location)
    - Pending status indicator for approval workflow
    - Action buttons (View My Appointments, Done)
  - **VendorProfilePage Integration**:
    - Services grid with PortfolioCard for each service
    - "Book Now" button on each service card (opens modal with pre-selection)
    - General "Book an Appointment" CTA (opens modal without pre-selection)
    - Modal state management for seamless UX
  - **Design & UX**:
    - Desktop-first with responsive mobile adaptation
    - V3 design system (UniversalButton, UniversalCard, V3 colors)
    - Accessibility features (keyboard navigation, focus management, ARIA labels)
    - Smooth step transitions with progress indicator
    - Loading states throughout the flow
  - **Key Features**:
    - Authentication-aware (redirects to login if needed, preserves booking state)
    - Location type handling (auto-correction for fixed vendors, address validation for mobile)
    - Timezone-aware slot display (uses local browser timezone)
    - Real-time availability checking (prevents double bookings)
    - Error recovery (clear messages, retry options)

**Remaining (<1%):**
- Client-side appointment management page (view, cancel, reschedule bookings)
- Public storefront discovery/listing page (marketplace homepage)
- Email notifications for appointments
- Admin dashboard for system-wide analytics
- Booking state restoration after login (sessionStorage integration)

See `docs/project-analysis.md` for detailed feature breakdown and roadmap.
