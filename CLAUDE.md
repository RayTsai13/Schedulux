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
│   │   ├── ui/            # shadcn/ui wrapped components (Button, Input, etc.)
│   │   └── vendor/        # Business-specific components (StorefrontFormModal, ServiceManager, HoursManager, TimezoneSelector, BusinessHoursEditor)
│   ├── hooks/             # Custom React hooks (useAuth, useStorefronts, useServices, useScheduleRules)
│   ├── pages/             # Route-level page components
│   │   ├── auth/          # Login, Signup pages
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
- **Reusable Components** (`components/`) - Pure functions, receive props, no side effects
- **UI Components** (`components/ui/`) - Wrapped shadcn/ui components with custom styling

#### State Management Strategy
- **Server State** (API data) → Use React Query hooks (`useQuery`, `useMutation`)
- **UI State** (modals open/closed, selected filters) → Use Zustand `create()` stores
- **Form State** → Use React Hook Form + Zod validation

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
- **`useStorefronts()`** - Fetch/manage vendor storefronts with Create/Update/Delete mutations
- **`useServices()`** - Fetch/manage services per storefront with Create/Update/Delete mutations
- **`useScheduleRules()`** - Fetch/manage schedule rules (availability patterns) with Create/Update/Delete mutations
- **`useAvailability()`** (NEW) - Fetch available appointment slots for a storefront/service with date range filtering
- **`useAppointments()`** (NEW) - Fetch user's appointments with status and date filtering
- **`useCreateAppointment()`** (NEW) - Create/book appointments with race condition prevention

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

**Current migration:** `migrations/004_clean_schema.sql` - Ensure this is applied before any development.

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
psql -d schedulux_primary -f backend/migrations/004_clean_schema.sql
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

**Current:** 92% complete - Core infrastructure, CRUD operations, availability engine, and booking API fully implemented.

**Completed Phases:**
- ✓ Phase 1: Storefront CRUD (API endpoints, service layer, React hooks, UI components)
- ✓ Phase 2: Service management CRUD (API endpoints, service layer, React hooks, UI components)
- ✓ Bonus: Schedule rules CRUD (API endpoints with ownership validation, rule-type constraints, React hooks)
- ✓ Phase 3a: Availability Engine (slot calculation, priority-based rule resolution, timezone handling)
- ✓ Phase 3b: Appointment Booking API (booking with race condition prevention, ownership validation)

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

**In Progress:**
- Phase 4: Calendar UI and appointment management components
  - Calendar interface with react-big-calendar
  - Appointment listing and filtering
  - Frontend hooks for availability and appointments

See `docs/project-analysis.md` for detailed feature breakdown and roadmap.
