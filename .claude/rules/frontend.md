# Frontend Rules

## Architecture

**Pattern:** Zustand (UI state) → Custom Hooks (wrap React Query) → Components

Two audiences:
- **Guests** (no account): public page `/@slug`, drop page `/@slug/drops/:id`, booking modal, `/manage/:token`
- **Vendors** (JWT): `/onboarding` then `/dashboard/*`, all scoped to their single page

## State Management

- Server state (API data) → React Query `useQuery`/`useMutation`
- UI state (modals, filters) → Zustand stores
- Form state → React Hook Form + Zod (the booking modal's guest form validates with a Zod schema via `safeParse`)
- Multi-step wizard state → component-local `useState` (BookingModal resets its state each time it opens)

## Guidelines

- React Query for server state — don't put API responses in Zustand
- Each page wraps itself in its layout (`App.tsx` routes do not): `PublicPageShell` for guest-facing vendor pages, `AppScaffold` for `/playground`, `DashboardLayout` for `/dashboard/*`, `AuthLayout` for auth pages. `LandingPage` renders its own nav/footer
- Vendor dashboard pages get the page via `useVendorPage()` (context from `<VendorRoute>`); never fetch a storefront by URL id
- Show booking times in the **vendor's** timezone with `formatInZone` / `formatCalendarDate` / `formatClock` from `lib/booking.ts`, not the viewer's
- TailwindCSS utility classes only (no CSS files). Use `clsx` or `cn()` (from `lib/utils.ts`) for conditionals
- **Colors: use design tokens only** (`styles/tokens.css`, mapped in `tailwind.config.js`) — never Tailwind palette colors like `red-500` or `gray-100`. Conventions:
  - errors → `text-error`, `bg-error-container`, `text-on-error-container`
  - success/confirmed → `bg-secondary-container`, `text-on-secondary-container`
  - pending/warning, drops → `bg-tertiary-fixed`, `text-on-tertiary-fixed`
  - neutrals → `surface-container-*`, `on-surface-variant`, `outline-variant`; text on primary → `text-on-primary`
  - appointment status badges: follow `STATUS_CFG` in `pages/vendor/VendorAppointmentsPage.tsx`
- `npm run build` (vite) does not type-check — run `npm run typecheck` too
- Cache invalidation: mutations must invalidate related queries. Bookings/cancels/reschedules also invalidate `['availability']` and `['page']` (spot counts); drops + schedule rules invalidate `['availability']`

## Project Structure

```
frontend/src/
├── components/
│   ├── auth/      # ProtectedRoute (vendor-only, exports FullPageSpinner), VendorRoute (+ useVendorPage)
│   ├── booking/   # BookingModal + steps (Service, DateTime w/ optional drop window, Confirm = guest details,
│   │              #   Success = manage link), PortfolioCard, RescheduleModal (token-based)
│   ├── public/    # PublicPageShell, SpotsMeter ("3 of 8 left"), WaitlistForm
│   ├── layout/    # AppScaffold, DashboardLayout (sidebar), AuthLayout
│   ├── vendor/    # PageSettingsForm (onboarding + settings), ServiceFormModal, ServicesTab,
│   │              #   ScheduleRuleFormModal, AvailabilityTab, DropsTab, DropFormModal, AppointmentDetailModal
│   └── ui/, universal/, ErrorBoundary.tsx
├── hooks/         # see below
├── lib/           # utils.ts (cn), booking.ts (pageUrl, manageUrl, copyLink, timezone formatters),
│                  #   playgroundPresets.ts
├── pages/
│   ├── public/    # PublicPage (/@slug), DropPage, ManageBookingPage
│   ├── vendor/    # OnboardingPage, VendorDashboardPage, PageManagerPage (?tab=drops|services|availability),
│   │              #   PageSettingsPage, VendorAppointmentsPage, AppointmentCalendarPage, VendorCustomersPage
│   ├── auth/, legal/
│   └── LandingPage, HomePage, PlaygroundPage (lazy-loaded), NotFoundPage
├── services/api.ts  # Axios client + typed APIs: authApi, storefrontApi, serviceApi, scheduleRuleApi,
│                    #   dropApi, appointmentApi, availabilityApi, bookingApi, pageApi, manageApi, uploadApi
└── App.tsx
```

## Available Custom Hooks

- `useAuth()` - vendor login/logout/register (React Context)
- `useMyStorefront()` / `useSlugAvailability(slug)` / `useCreateStorefront()` / `useUpdateStorefront()`
- `usePublicPage(slug, { live })` - public page; `live` polls every 30s (drop pages)
- `useManagedBooking(token)` / `useCancelManagedBooking(token)` / `useRescheduleManagedBooking(token)`
- `useServices(storefrontId)` + CRUD mutations
- `useScheduleRules(storefrontId)` + CRUD mutations
- `useDrops(storefrontId)` (vendor; includes spot counts + `waitlist_count`) + CRUD, `useJoinWaitlist()`
- `useAvailability({ storefrontId, serviceId, startDate, endDate })`
- `useStorefrontAppointments(id)`, `useCreateAppointment()` (guest), status mutations
- `useHandle()` - slug from a `/@slug` route segment (null if the segment has no `@`)

## Routing

React Router can't match `/@:slug`, so `/:handle` and `/:handle/drops/:dropId` are registered **after** all static routes; pages call `useHandle()` and render `NotFoundPage` when the segment doesn't start with `@`. Add new top-level static routes above them and add the word to the backend's `RESERVED_SLUGS`.

```
/                         → HomePage (LandingPage, or /dashboard if signed in)
/login, /register, /forgot-password, /reset-password, /privacy, /terms, /cookies
/playground               → PlaygroundPage (engine in the browser; state in URL hash)
/manage/:token            → ManageBookingPage
/onboarding               → OnboardingPage (signed in, no page yet)
/dashboard                → VendorDashboardPage          ┐
/dashboard/page?tab=…     → PageManagerPage               │ <VendorRoute>: signed-in vendor
/dashboard/settings       → PageSettingsPage              │ with a page (else → /onboarding)
/dashboard/appointments   → VendorAppointmentsPage        │
/dashboard/calendar       → AppointmentCalendarPage       │
/dashboard/customers      → VendorCustomersPage           ┘
/:handle                  → PublicPage (/@slug)
/:handle/drops/:dropId    → DropPage
*                         → NotFoundPage
```

## Booking Modal

**Steps:** Service → Date/Time → Your Details (name, email, phone?, notes) → Success (manage link)

- Props: `storefront: PublicStorefront`, `services`, `preSelectedServiceId?`, `drop?: PublicDrop`
- With `drop`, services are limited to the drop's service and times to the drop window (calendar pinned to that date)
- A single bookable service skips step 1

## Environment Variables

`VITE_API_URL` at build time (default `http://localhost:3000/api`).

## Zustand Stores

- `useUIStore` — `activeModal`, `isSidebarOpen`, `isGlobalLoading`
- `useCalendarStore` — `calendarView`, `selectedDate`, `filters` (persisted as `schedulux-calendar`, minus `selectedDate`)

## Debugging

- React Query DevTools: floating button, bottom-right in dev
- Vendor auth: `localStorage.getItem('auth_token')`
- Playground state: decode the URL hash with `decodeState` from `lib/playgroundPresets.ts`
