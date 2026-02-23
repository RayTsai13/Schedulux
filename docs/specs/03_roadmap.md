# 🛠 Implementation Roadmap

**Strategic Direction:** Desktop-first UI with clean web application patterns. Build a fully-featured desktop experience that can be adapted to native iOS later. This means:
- Standard web modals/dialogs instead of bottom sheets
- Full desktop layouts with sidebars, multi-column grids
- Responsive design that scales down to tablet/mobile
- No mobile-specific patterns (bottom nav, pull-to-dismiss, etc.)

## Phase 1: The Foundation (1-2 Days)
1.  [x] **Install Dependencies:** `framer-motion` (Animations), `clsx/tailwind-merge`.
2.  [x] **Tailwind Config:** Setup the semantic colors (background, surface, accent).
3.  [x] **Base Components:** Build the "Atoms":
    *   [x] `UniversalButton.tsx` (Multiple variants)
    *   [x] `UniversalCard.tsx` (Container component)
    *   [ ] `UniversalModal.tsx` (Standard web modal/dialog - NOT bottom sheet)
    *   [x] `AppScaffold.tsx` (Desktop-first layout with responsive scaling)

## Phase 2: The Client View (3-4 Days)
*Focus: Public-facing vendor profiles and booking.*
1.  [x] **Profile Header:** Avatar, Bio, Socials, Verified badge
2.  [x] **Drop Card:** Visualizing `AvailabilityService` data as availability windows
3.  [x] **Portfolio Grid:** Visualizing `Service` data with images and pricing
4.  [ ] **Booking Modal:** Desktop modal flow connecting `useCreateAppointment`
    *   Step 1: Select service
    *   Step 2: Pick date/time
    *   Step 3: Confirm details
    *   Step 4: Success confirmation

## Phase 3: The Creator Dashboard (3-4 Days)
*Focus: Vendor management interface.*
1.  [ ] **Dashboard Layout:** Side navigation, multi-panel desktop layout
2.  [ ] **Availability Manager:** Create and manage schedule rules/drops
3.  [ ] **Service Manager:** Add/edit services with image upload
4.  [ ] **Appointment Manager:** View, confirm, cancel bookings
5.  [ ] **Analytics:** Revenue tracking, booking stats

## Phase 4: Enhanced Features (2-3 Days)
1.  [ ] **Search & Discovery:** Public marketplace with filtering
2.  [ ] **Client Dashboard:** View bookings, rebook, cancel
3.  [ ] **Notifications:** Email confirmations, reminders
4.  [ ] **Profile Customization:** Themes, branding, custom URLs

## Phase 5: Polish (2 Days)
1.  [ ] **Micro-interactions:** Smooth transitions, hover states
2.  [ ] **Empty States:** Elegant placeholders for no data
3.  [ ] **Loading Skeletons:** Shimmer effects while fetching
4.  [ ] **Error Handling:** User-friendly error messages
5.  [ ] **Responsive Testing:** Ensure tablet/mobile scaling works

## Future: iOS Native App
Once desktop experience is solid, the iOS app will:
- Use the same backend APIs (100% code reuse)
- Adapt UI patterns to native iOS (SwiftUI)
- Add mobile-specific features (push notifications, location services)
- Share design language but optimize for touch-first interaction