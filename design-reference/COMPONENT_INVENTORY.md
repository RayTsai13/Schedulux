# Component Inventory

> 41 files total — 35 visually significant, 6 logic/routing only

| File | Category | Description | Visually Significant? |
|---|---|---|---|
| `hooks/useAuth.tsx` | Auth | Context provider for authentication state with login, register, logout, and user refresh methods. | No |
| `components/auth/ProtectedRoute.tsx` | Auth | Checks user authentication and role, redirects if unauthorized or shows loading spinner. | No |
| `components/booking/BookingModal.tsx` | Booking | 4-step wizard for booking appointments with service selection, date/time picking, confirmation, and success screen. | Yes |
| `components/booking/BookingStepConfirm.tsx` | Booking | Confirmation step showing booking summary with location type selection and optional notes input. | Yes |
| `components/booking/BookingStepDateTime.tsx` | Booking | Calendar and time slot picker for selecting appointment date and time. | Yes |
| `components/booking/BookingStepService.tsx` | Booking | Service selection grid using PortfolioCards for clients to choose a service. | Yes |
| `components/booking/BookingSuccess.tsx` | Booking | Success confirmation screen displaying appointment details with action buttons. | Yes |
| `components/booking/DropCard.tsx` | Booking | Card component displaying a limited-time drop with date badge, availability count, and claim button. | Yes |
| `components/booking/PortfolioCard.tsx` | Booking | Service card displaying image, name, price, duration with book now button. | Yes |
| `components/booking/ProfileHeader.tsx` | Booking | Vendor profile header showing avatar, name, description, location, verified badge, and Instagram link. | Yes |
| `components/booking/RescheduleModal.tsx` | Booking | 2-step modal for rescheduling appointments with date/time selection and confirmation with side-by-side time comparison. | Yes |
| `components/ErrorBoundary.tsx` | Error | Class component catching React errors and displaying error UI with reset button. | Yes |
| `components/layout/AppScaffold.tsx` | Layout | Main layout wrapper with sticky navbar, logo, navigation links, user menu, and content area. | Yes |
| `App.tsx` | Layout | React Router config with route definitions, protected routes, and toast notifications setup. | No |
| `components/marketplace/StorefrontCard.tsx` | Marketplace | Vendor card for marketplace grid showing avatar, name, location type, verification status, services, price range, distance, and action button. | Yes |
| `pages/admin/AdminDashboardPage.tsx` | Page | Admin dashboard with stats cards and paginated storefront table with verification toggle controls. | Yes |
| `pages/auth/ForgotPasswordPage.tsx` | Page | Form page for requesting password reset with email input and success message display. | Yes |
| `pages/auth/LoginPage.tsx` | Page | Login form with email and password inputs, validation errors, and signup link with return URL support. | Yes |
| `pages/auth/RegisterPage.tsx` | Page | Registration form with name, email, password, and role selection with server error handling. | Yes |
| `pages/auth/ResetPasswordPage.tsx` | Page | Password reset form with token validation, password confirmation, and success/error states. | Yes |
| `pages/client/ClientAppointmentsPage.tsx` | Page | Client's appointments list with status filtering, sort by date, and reschedule/cancel action buttons. | Yes |
| `pages/ExplorePage.tsx` | Page | Marketplace search and filter page with search bar, geolocation toggle, location type filters, and storefront grid. | Yes |
| `pages/HomePage.tsx` | Page | Smart redirect page that shows loading state and redirects based on user role or authentication status. | No |
| `pages/LandingPage.tsx` | Page | Hero landing page with feature cards, how-it-works steps, stats section, and CTAs with gradient backgrounds. | Yes |
| `pages/NotFoundPage.tsx` | Page | 404 error page with message and button to return to marketplace. | Yes |
| `pages/VendorProfilePage.tsx` | Page | Public vendor profile showing header, upcoming drops, services with booking modal, and session storage restoration. | Yes |
| `pages/vendor/AppointmentCalendarPage.tsx` | Page | Vendor calendar view showing appointments color-coded by status with month/week/day/agenda views and filter. | Yes |
| `pages/vendor/StorefrontDetailPage.tsx` | Page | Vendor storefront management page with 3 tabs (drops/services/availability), breadcrumb, and header with action buttons. | Yes |
| `pages/vendor/VendorDashboardPage.tsx` | Page | Vendor dashboard showing storefronts grid with descriptions, locations, badges, and create storefront button. | Yes |
| `components/ui/Modal.tsx` | UI | Generic modal component with portal rendering, escape key handling, focus trap, and customizable sizing. | Yes |
| `components/ui/Tabs.tsx` | UI | Tab component with active indicator underline and content switching. | Yes |
| `components/universal/UniversalButton.tsx` | Universal | Reusable button with variants (primary/secondary/outline/ghost), sizes, loading state, and optional icons. | Yes |
| `components/universal/UniversalCard.tsx` | Universal | Reusable card wrapper with hover effects, padding options, and consistent styling. | Yes |
| `components/vendor/AppointmentDetailModal.tsx` | Vendor | Modal showing appointment details with status badge, date/time, client info, location, notes, and status action buttons. | Yes |
| `components/vendor/AvailabilityTab.tsx` | Vendor | Calendar view with rules and drops visualization, day click popover showing rules/drops/appointments, and management controls. | Yes |
| `components/vendor/CreateStorefrontModal.tsx` | Vendor | Form modal for creating new storefronts with profile type, location type, address/service area fields, and validation. | Yes |
| `components/vendor/DropFormModal.tsx` | Vendor | Modal form for creating/editing drops with title, date, time, service selection, concurrency limits, and publish toggle. | Yes |
| `components/vendor/DropsTab.tsx` | Vendor | Tab content showing grid of drop cards with edit/delete actions and empty state. | Yes |
| `components/vendor/ScheduleRuleFormModal.tsx` | Vendor | Modal for creating/editing availability rules with rule type selection, time inputs, availability toggle, and concurrency settings. | Yes |
| `components/vendor/ServiceFormModal.tsx` | Vendor | Modal for creating/editing services with image upload (drag/drop), name, description, duration, buffer time, price, category fields. | Yes |
| `components/vendor/ServicesTab.tsx` | Vendor | Tab content showing grid of service cards with edit/delete actions and empty state. | Yes |
