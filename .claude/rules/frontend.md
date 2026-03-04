# Frontend Rules

## Architecture

**Pattern:** Zustand (UI state) → Custom Hooks (wrap React Query) → Components

## State Management

- Server state (API data) → React Query `useQuery`/`useMutation`
- UI state (modals, filters) → Zustand stores
- Form state → React Hook Form + Zod
- Multi-step wizard state → component-local `useState` (e.g., BookingModal)

## Guidelines

- React Query for server state — don't put API responses in Zustand
- Form validation: define Zod schema, use `zodResolver` with React Hook Form
- All pages must include `<Header />` at the top
- TailwindCSS utility classes only (no CSS files). Use `clsx` for conditionals

## Project Structure

```
frontend/src/
├── components/
│   ├── ui/        # shadcn/ui wrapped components
│   ├── universal/ # V3 design system (UniversalButton, UniversalCard)
│   ├── booking/   # Client booking flow (BookingModal + wizard steps, PortfolioCard, ProfileHeader, DropCard)
│   ├── layout/    # AppScaffold, Header
│   └── vendor/    # Vendor management (StorefrontFormModal, ServiceManager, HoursManager, DropsTab, DropFormModal)
├── hooks/         # Custom hooks (see below)
├── pages/         # Route-level components (auth/, vendor/, VendorProfilePage.tsx)
├── services/      # Axios API client with JWT interceptor
├── stores/        # Zustand (UI, Calendar state)
└── App.tsx        # React Router v7 with protected routes
```

## Available Custom Hooks

- `useAuth()` - login, logout, token, user info
- `useStorefronts()` - CRUD with mutations
- `useServices()` - per-storefront CRUD
- `useScheduleRules()` - availability patterns CRUD
- `useDrops(storefrontId)` / `usePublicDrops(storefrontId)` - vendor drops CRUD + public listing
- `useAvailability(storefrontId, serviceId, startDate, endDate)` - available slots in YYYY-MM-DD range, timezone-aware
- `useAppointments()` / `useStorefrontAppointments(id)` / `useClientAppointments()` - with confirm/cancel/complete mutations
- `useCreateAppointment()` - race-condition-safe booking
- `useMarketplace()` / `usePublicStorefront(id)` - public, no auth required

## Booking Modal (4-step wizard)

**Steps:** Service → Date/Time → Confirm → Success

- Local state over Zustand (self-contained flow)
- Pre-selection support (skip step 1 if service already chosen)
- Drop pre-selection: `preSelectedDropId` prop passes `drop_id` to appointment API
- Drop service filtering: `dropServiceId` prop filters step 1 to only the drop's linked service
- Auth check deferred until final confirmation step
- Address input only shown for mobile/hybrid vendors

## Debugging

- React Query DevTools: floating button, bottom-right
- Auth: `localStorage.getItem('authToken')` in browser console
