# 💻 Schedulux 3.0: App Definition

## Core Concept
A modern booking platform for service providers with flexible availability. Features visual portfolios, availability "drops" (time windows), and streamlined booking workflows.

## Design Philosophy: "Desktop-First Web Application"
- **Desktop-First:** Built for desktop browsers (1024px+) with full responsive scaling
- **Web-Native Patterns:** Standard modals, sidebars, multi-column grids
- **Progressive Enhancement:** Scales gracefully to tablet and mobile
- **Visual Portfolio:** Service images and availability windows as primary discovery
- **Future iOS App:** Separate native implementation using the same backend APIs

## User Roles & Pages

### 1. Client (Customer) - Public View
*   **Marketplace/Discovery:**
    *   Search and browse vendor profiles
    *   Filter by location, service type, availability
    *   Grid layout with vendor cards
*   **Vendor Profile Page (`/book/:storefrontId`):**
    *   Profile header (Avatar, Bio, Verified badge, Social Links)
    *   Services grid (Portfolio cards with images, pricing, duration)
    *   Active availability windows (Drop cards showing upcoming slots)
    *   "Book Appointment" CTA
*   **Booking Flow (Modal):**
    *   Triggered by clicking "Book" or selecting a service/drop
    *   Step 1: Select Service (if not already selected)
    *   Step 2: Pick Date & Time (calendar + time slots)
    *   Step 3: Enter Details (name, email, phone)
    *   Step 4: Confirmation (success message with details)
*   **Client Dashboard (`/dashboard`):**
    *   View upcoming appointments
    *   View past appointments
    *   Cancel/reschedule bookings
    *   Rebook with favorite vendors

### 2. Vendor (Service Provider) - Private View
*   **Vendor Dashboard (`/vendor/dashboard`):**
    *   Side navigation (persistent left sidebar)
    *   Quick stats (Revenue, upcoming appointments, booking rate)
    *   Recent bookings list
    *   Calendar view of appointments
*   **Storefront Management (`/vendor/storefronts`):**
    *   Create/edit storefront profile
    *   Manage business hours, location, bio
    *   Upload avatar and branding
    *   Public profile preview
*   **Service Management (`/vendor/services`):**
    *   Add/edit/delete services
    *   Upload service images
    *   Set pricing and duration
    *   Mark featured services
*   **Availability Management (`/vendor/availability`):**
    *   Create "drops" (availability windows)
    *   Manage schedule rules (recurring, one-time)
    *   Set capacity limits
    *   Calendar view of open slots
*   **Appointments (`/vendor/appointments`):**
    *   View all bookings (upcoming, past, cancelled)
    *   Filter by status, date range
    *   Confirm/decline pending requests
    *   Mark appointments complete
    *   View client details

## Key Interactions
1.  **The "Drop":** Vendor creates an availability window (e.g., "Friday Night - 6 slots available")
2.  **Discovery:** Client searches marketplace or navigates to vendor profile
3.  **Booking:** Client clicks service/drop → Modal opens → Select time → Confirm → Appointment created
4.  **Management:** Vendor views appointments in dashboard → Confirm/complete bookings