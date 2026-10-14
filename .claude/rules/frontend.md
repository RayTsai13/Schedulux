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
- Each page wraps itself in its layout (`App.tsx` routes do not): `AppScaffold` for public/client/admin pages, `DashboardLayout` (sidebar) for vendor `/dashboard/*` pages, `AuthLayout` for auth pages. `LandingPage` renders its own nav/footer
- TailwindCSS utility classes only (no CSS files). Use `clsx` or `cn()` (from `lib/utils.ts`) for conditionals
- **Colors: use design tokens only** (`styles/tokens.css`, mapped in `tailwind.config.js`) — never Tailwind palette colors like `red-500` or `gray-100`. Conventions:
  - errors → `text-error`, `bg-error-container`, `text-on-error-container`
  - success/confirmed → `bg-secondary-container`, `text-on-secondary-container`
  - pending/warning → `bg-tertiary-fixed`, `text-on-tertiary-fixed`
  - neutrals → `surface-container-*`, `on-surface-variant`, `outline-variant`; text on primary → `text-on-primary`
  - appointment status badges: follow `STATUS_CFG` in `pages/vendor/VendorAppointmentsPage.tsx`
- `npm run build` (vite) does not type-check — run `npm run typecheck` too
- Cache invalidation: mutations must invalidate related queries (`queryClient.invalidateQueries`). Drops + schedule rules also invalidate `['availability']`

## Project Structure

```
frontend/src/
├── components/
│   ├── ui/        # shadcn/ui components (button, input, label, select, textarea, Modal, Tabs)
│   ├── universal/ # V3 design system (UniversalButton, UniversalCard)
│   ├── booking/   # Client booking flow (BookingModal + wizard steps, PortfolioCard, ProfileHeader, DropCard, RescheduleModal)
│   ├── layout/    # AppScaffold (public navbar), DashboardLayout (vendor sidebar), AuthLayout
│   ├── marketplace/ # StorefrontCard
│   ├── vendor/    # Vendor management (CreateStorefrontModal, ServiceFormModal, ServicesTab,
│   │              #   ScheduleRuleFormModal, AvailabilityTab, DropsTab, DropFormModal,
│   │              #   AppointmentDetailModal)
│   └── ErrorBoundary.tsx  # Class component — wraps entire app in App.tsx
├── config/        # queryClient.ts (React Query config)
├── hooks/         # Custom hooks (see below)
├── lib/           # utils.ts (clsx/tailwind-merge helper)
├── pages/
│   ├── auth/      # LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage
│   ├── vendor/    # VendorDashboardPage, VendorStorefrontsPage, VendorAppointmentsPage,
│   │              #   VendorCustomersPage, StorefrontDetailPage, AppointmentCalendarPage
│   ├── client/    # ClientAppointmentsPage
│   ├── admin/     # AdminDashboardPage
│   ├── legal/     # LegalPageLayout + PrivacyPolicyPage, TermsOfServicePage, CookiePolicyPage
│   ├── NotFoundPage.tsx   # 404 catch-all (last route in App.tsx)
│   └── ...        # LandingPage, HomePage (smart redirect), ExplorePage, VendorProfilePage
├── services/      # api.ts — Axios API client with JWT interceptor (base URL from VITE_API_URL env var)
├── stores/        # Zustand: useUIStore, useCalendarStore (persisted), useStorefrontStore (persisted)
└── App.tsx        # React Router v7 with protected routes
```

## Available Custom Hooks

- `useAuth()` - login, logout, token, user info (React Context, not Zustand)
- `useStorefronts()` / `useStorefront(id)` / `useCreateStorefront()` / `useUpdateStorefront()` / `useDeleteStorefront()` - storefront CRUD
- `useServices(storefrontId)` / `useCreateService()` / `useUpdateService()` / `useDeleteService()` - per-storefront service CRUD
- `useScheduleRules(storefrontId)` / `useCreateScheduleRule()` / `useUpdateScheduleRule()` / `useDeleteScheduleRule()` - availability patterns
- `useDrops(storefrontId)` / `usePublicDrops(storefrontId)` - vendor drops CRUD + public listing (no auth)
- `useAvailability({ storefrontId, serviceId, startDate, endDate })` - available slots (staleTime: 30s, no auth)
- `useClientAppointments()` / `useStorefrontAppointments(id)` - client and vendor appointment views
- `useCreateAppointment()` - race-condition-safe booking (invalidates appointments + availability on success)
- `useUpdateAppointmentStatus()` / `useCancelAppointment()` / `useConfirmAppointment()` / `useCompleteAppointment()`
- `useRescheduleAppointment()` - atomic cancel+rebook mutation, invalidates all appointment queries on success
- `usePublicStorefront(id)` / `useMarketplaceSearch(params)` - public marketplace (no auth required)
- `useAdminStats()` / `useAdminStorefronts(limit, offset)` / `useVerifyStorefront()` - admin dashboard

## Booking Modal (4-step wizard)

**Steps:** Service → Date/Time → Confirm → Success

- Local state over Zustand (self-contained flow)
- Pre-selection support (skip step 1 if service already chosen)
- Drop pre-selection: `preSelectedDropId` prop passes `drop_id` to appointment API
- Drop service filtering: `dropServiceId` prop filters step 1 to only the drop's linked service
- Auth check deferred until final confirmation step
- Address input only shown for mobile/hybrid vendors
- **SessionStorage restoration:** On open when authenticated, checks `sessionStorage.pendingBooking` for a matching storefrontId and restores service/location/notes, skipping to step 2

## Reschedule Modal

**File:** `components/booking/RescheduleModal.tsx`

**Props:** `{ isOpen, onClose, appointment }`

**Flow:** 2 steps — Pick new date/time (reuses `BookingStepDateTime`) → Confirm (old vs. new time side-by-side). Calls `useRescheduleAppointment()` on confirm.

## Post-Login Booking Restoration

When an unauthenticated user hits "Book Appointment":
1. `BookingModal` saves `pendingBooking` to sessionStorage and redirects to `/login?returnTo=/book/:id`
2. `LoginPage` reads `returnTo` param and navigates there after successful login
3. `VendorProfilePage` checks sessionStorage on mount; if storefrontId matches, restores pre-selection and opens modal
4. `BookingModal` checks sessionStorage on open when authenticated; restores state and skips to step 2

## Password Reset Pages

**`ForgotPasswordPage`** (`pages/auth/ForgotPasswordPage.tsx`):
- Zod schema: `{ email: z.string().email() }`
- Calls `authApi.forgotPassword(email)` — always shows success message (backend prevents enumeration)

**`ResetPasswordPage`** (`pages/auth/ResetPasswordPage.tsx`):
- Reads `token` from `useSearchParams`
- Zod schema with `.refine()` to validate password === confirmPassword
- Calls `authApi.resetPassword(token, password)`

## Environment Variables

Frontend reads `VITE_API_URL` at build time (Vite replaces `import.meta.env.VITE_API_URL`). Default fallback: `http://localhost:3000/api`. Set in `frontend/.env` for local dev or as a Docker build arg for production.

## Zustand Stores

- `useUIStore` — `activeModal`, `isSidebarOpen`, `isGlobalLoading` (not persisted)
- `useCalendarStore` — `calendarView`, `selectedDate`, `filters` (persisted to localStorage as `schedulux-calendar`, `selectedDate` excluded from persistence)
- `useStorefrontStore` — `selectedStorefrontId` (persisted to localStorage as `schedulux-storefront`)

## Route Map

```
/                    → HomePage (smart redirect by role: admin→/admin, vendor→/dashboard, client→/explore, unauth→LandingPage)
/login, /register    → Auth pages
/forgot-password, /reset-password → Password reset flow
/explore             → ExplorePage (marketplace search, no auth)
/privacy, /terms, /cookies → Legal pages (no auth; placeholder text pending legal review)
/book/:storefrontId  → VendorProfilePage (public profile + BookingModal)
/dashboard           → VendorDashboardPage (protected: vendor)
/dashboard/storefronts   → VendorStorefrontsPage (protected: vendor)
/dashboard/appointments  → VendorAppointmentsPage (protected: vendor)
/dashboard/customers     → VendorCustomersPage (protected: vendor)
/dashboard/storefront/:id → StorefrontDetailPage (protected: vendor, 3 tabs: Drops/Services/Availability)
/dashboard/storefront/:id/calendar → AppointmentCalendarPage (protected: vendor)
/my-appointments     → ClientAppointmentsPage (protected: client)
/admin               → AdminDashboardPage (protected: admin)
*                    → NotFoundPage (404 catch-all)
```

## Debugging

- React Query DevTools: floating button, bottom-right corner in dev
- Auth: `localStorage.getItem('auth_token')` in browser console
- API base URL: `import.meta.env.VITE_API_URL` (check in browser console)
- Pending booking restoration: `sessionStorage.getItem('pendingBooking')` in browser console
