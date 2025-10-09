# Schedulux Frontend Development Plan

**Last Updated:** October 6, 2025
**Overall Progress:** ~20%

## Current Status

### ✅ Completed
- Backend authentication API (register, login, profile)
- Backend storefront CRUD API
- Database schema (100% complete)
- TanStack Query + Zustand state management
- Storefront Management UI (list, empty state, delete)
- Protected routes and auth flow

### ⏳ In Progress
- Storefront form components (create/edit modal)

### ❌ Not Started
- Service management system
- Appointment booking flow
- Calendar interface
- Client features
- Schedule rules management
- Analytics dashboard

---

## Phase 1: Complete Storefront Management (4-6 hours)

### Create Modal Component
**File:** `frontend/src/components/ui/Modal.tsx`

Create reusable modal wrapper:
- Portal rendering for proper z-index
- Backdrop with click-to-close
- ESC key handler
- Focus trap for accessibility
- Animation transitions

### Create Timezone Selector
**File:** `frontend/src/components/vendor/TimezoneSelector.tsx`

Searchable timezone dropdown:
- List all IANA timezones (use `Intl.supportedValuesOf('timeZone')`)
- Group by region (America/, Europe/, Asia/, etc.)
- Show UTC offset for each timezone
- Search/filter functionality
- Default to UTC

### Create Business Hours Editor
**File:** `frontend/src/components/vendor/BusinessHoursEditor.tsx`

Weekly schedule builder:
- 7-day configuration (Sunday through Saturday)
- Open/closed toggle for each day
- Multiple time periods per day (for split shifts)
- Time pickers with validation (end > start)
- "Copy to other days" functionality
- Visual preview of weekly schedule
- Handle JSONB format:
  ```typescript
  {
    "monday": {
      "isOpen": true,
      "periods": [{ "start": "09:00", "end": "17:00" }]
    },
    "tuesday": { "isOpen": false, "periods": [] }
  }
  ```

### Create Storefront Form Modal
**File:** `frontend/src/components/vendor/StorefrontFormModal.tsx`

Main form component:
- Use Modal wrapper
- Fields: name, description, address, phone, email
- Integrate TimezoneSelector component
- Integrate BusinessHoursEditor component
- Zod validation schema
- Handle create vs edit mode (pre-populate data for edit)
- Connect to `useCreateStorefront()` / `useUpdateStorefront()` hooks
- Success toast on save
- Error handling

### Wire Up UI
**File:** `frontend/src/pages/vendor/StorefrontManagement.tsx`

Connect buttons:
- "Add Storefront" button → open create modal
- "Edit" button → open edit modal with pre-populated data
- Pass storefront data to modal for edit mode
- Test full CRUD flow (create, read, update, delete)

---

## Phase 2: Service Management (8-10 hours)

### Backend - Service API
**Files:**
- `backend/src/routes/services.ts`
- `backend/src/models/Service.ts`
- `backend/src/services/ServiceService.ts`

Create endpoints:
- `GET /api/services?storefront_id=X` - List services
- `POST /api/services` - Create service
- `PUT /api/services/:id` - Update service
- `DELETE /api/services/:id` - Soft delete

Service fields:
- `storefront_id` (required, FK to storefronts)
- `name` (required)
- `description` (optional)
- `duration_minutes` (required, > 0)
- `buffer_time_minutes` (default 0, >= 0)
- `price` (optional, decimal)
- `category` (optional, string)
- `is_active` (boolean, default true)

### Frontend - Service Management Page
**File:** `frontend/src/pages/vendor/ServiceManagement.tsx`

Create page with:
- Storefront selector dropdown (if multiple storefronts)
- List all services for selected storefront
- Empty state for no services
- Service cards with details
- Create/Edit/Delete actions
- Loading and error states

### Frontend - Service Components
**Files:**
- `frontend/src/components/vendor/ServiceCard.tsx`
- `frontend/src/components/vendor/ServiceForm.tsx`
- `frontend/src/components/vendor/DurationPicker.tsx`

Components:
- ServiceCard - Display service details with edit/delete buttons
- ServiceForm - Modal form with all fields + validation
- DurationPicker - Hour/minute input for duration and buffer time

### Frontend - API Integration
**Files:**
- `frontend/src/services/api.ts` (add `serviceApi`)
- `frontend/src/hooks/useServices.ts`

TanStack Query hooks:
- `useServices(storefrontId)` - List services
- `useCreateService()` - Create mutation
- `useUpdateService()` - Update mutation
- `useDeleteService()` - Delete mutation

---

## Phase 3: Appointment Booking (34-43 hours)

### Backend - Appointment API
**Files:**
- `backend/src/routes/appointments.ts`
- `backend/src/models/Appointment.ts`
- `backend/src/services/AppointmentService.ts`
- `backend/src/services/AvailabilityService.ts`

Endpoints:
- `GET /api/appointments?storefront_id=X&start=Y&end=Z` - List appointments
- `POST /api/appointments` - Create appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Cancel appointment
- `GET /api/appointments/availability?storefront_id=X&service_id=Y&date=Z` - Available slots

Availability calculation logic:
- Query schedule_rules with priority ordering
- Apply weekly/daily/monthly patterns
- Check existing appointments for conflicts
- Respect service duration + buffer time
- Return available time slots

### Frontend - Calendar View Component
**File:** `frontend/src/components/scheduling/CalendarView.tsx`

Build custom calendar:
- Month/week/day view toggle (use `useCalendarStore` for state)
- Calendar grid layout with proper date calculations
- Display appointments with color coding:
  - Pending: Yellow
  - Confirmed: Purple
  - Completed: Green
  - Cancelled: Red
- Click on time slot to create appointment
- Current time indicator
- Navigation: previous/next period, today button
- Mobile-responsive design

### Frontend - Appointment Wizard
**File:** `frontend/src/pages/vendor/CreateAppointment.tsx`

Multi-step booking flow:
1. Select storefront (if multiple)
2. Select/create client
3. Choose service
4. Pick date
5. Select available time slot
6. Add notes (optional)
7. Confirm and create

### Frontend - Appointment Components
**Files:**
- `frontend/src/components/scheduling/ClientSelector.tsx`
- `frontend/src/components/scheduling/ServiceSelector.tsx`
- `frontend/src/components/scheduling/TimeSlotPicker.tsx`

Components:
- ClientSelector - Search existing clients or create new
- ServiceSelector - Visual grid of available services
- TimeSlotPicker - Display available time slots from API

### Frontend - Appointment Management
**File:** `frontend/src/pages/vendor/AppointmentDetails.tsx`

Detail page:
- View full appointment details (use existing `AppointmentDetailCard`)
- Edit appointment (reschedule, change service)
- Cancel appointment
- Status transitions: pending → confirmed → completed
- Add/edit notes
- View appointment history

---

## Phase 4: Client Features (14-18 hours)

### Public Booking Page
**File:** `frontend/src/pages/public/BookingPage.tsx`

Public-facing booking (no auth):
- Display storefront information
- Browse available services
- View calendar of available slots
- Guest booking flow
- Email confirmation

### Client Dashboard
**File:** `frontend/src/pages/client/ClientDashboard.tsx`

Client interface:
- View upcoming appointments
- View appointment history
- Cancel appointments
- Reschedule appointments
- Favorite storefronts

---

## Phase 5: Schedule Rules (24-30 hours)

### Backend - Schedule Rules API
**Files:**
- `backend/src/routes/scheduleRules.ts`
- `backend/src/models/ScheduleRule.ts`
- `backend/src/services/ScheduleRuleService.ts`

Endpoints:
- `GET /api/schedule-rules?storefront_id=X`
- `POST /api/schedule-rules`
- `PUT /api/schedule-rules/:id`
- `DELETE /api/schedule-rules/:id`

Rule types:
- **Weekly:** Repeating pattern (day_of_week 0-6)
- **Daily:** Specific date (specific_date field)
- **Monthly:** Monthly pattern (month + day_of_week)

Priority system:
- Higher priority overrides lower
- Example: Priority 1 = "Mon-Fri 9-5", Priority 10 = "Dec 25 closed"

### Frontend - Schedule Rules UI
**File:** `frontend/src/pages/vendor/ScheduleRules.tsx`

Schedule rules manager:
- List all rules with priority order
- Create weekly recurring rules
- Create daily specific rules
- Create monthly rules
- Set priority levels (1-100)
- Service-specific vs storefront-wide toggle
- Available/unavailable toggle
- Max concurrent appointments setting
- Visual calendar preview of rules

### Frontend - Appointment Slots
**File:** `frontend/src/pages/vendor/SlotManagement.tsx`

Predefined slots manager:
- Create individual slots
- Set capacity per slot (max bookings)
- Enable/disable slots
- View current booking count
- Bulk create slots wizard

---

## Phase 6: Analytics & Client Management (16-20 hours)

### Analytics Dashboard
**File:** `frontend/src/pages/vendor/Analytics.tsx`

Metrics display:
- Total appointments (week/month/year)
- Revenue metrics
- Most popular services
- Busiest time slots
- Client retention rate
- Charts using recharts library

Backend API:
- `GET /api/analytics/appointments?storefront_id=X&start=Y&end=Z`
- `GET /api/analytics/revenue?storefront_id=X&start=Y&end=Z`
- `GET /api/analytics/services?storefront_id=X&start=Y&end=Z`

### Client Management
**File:** `frontend/src/pages/vendor/ClientManagement.tsx`

Client list:
- Display all clients
- Search and filter
- View appointment history per client
- Add/edit client notes
- Contact information

---

## Phase 7: Settings (8-12 hours)

### User Profile Settings
**File:** `frontend/src/pages/settings/ProfileSettings.tsx`

Profile management:
- Edit name, email, phone, timezone
- Change password (requires current password)
- Email preferences
- Connect to `PUT /api/users/profile` endpoint

### Business Settings
**File:** `frontend/src/pages/settings/BusinessSettings.tsx`

Vendor settings:
- Default timezone
- Default booking duration
- Notification preferences
- Account settings

---

## Phase 8: Polish & Accessibility (16-22 hours)

### Responsive Design Testing
- Test all components on mobile (375px width)
- Test tablet layout (768px width)
- Test desktop layout (1024px+ width)
- Touch-friendly tap targets (min 44x44px)
- Mobile calendar view optimization

### Loading States
- Skeleton components for all major views
- Loading spinners for buttons
- Optimistic updates for mutations
- Global loading indicator

### Error Handling
- Global error boundary component
- Retry logic for failed API calls
- User-friendly error messages
- Network error detection

### Accessibility
- ARIA labels on all interactive elements
- Keyboard navigation (Tab, Enter, Escape)
- Focus management in modals
- Screen reader testing
- Color contrast verification (WCAG AA)

---

## Timeline Estimate

| Phase | Hours | Days (6h/day) |
|-------|-------|---------------|
| Phase 1: Storefront Forms | 4-6 | 1 |
| Phase 2: Service Management | 8-10 | 1-2 |
| Phase 3: Appointments | 34-43 | 6-8 |
| Phase 4: Client Features | 14-18 | 2-3 |
| Phase 5: Schedule Rules | 24-30 | 4-5 |
| Phase 6: Analytics | 16-20 | 3-4 |
| Phase 7: Settings | 8-12 | 1-2 |
| Phase 8: Polish | 16-22 | 3-4 |
| **Total** | **124-161** | **~4-5 weeks** |

---

## Next Steps

1. Start with Phase 1: Create Modal.tsx component
2. Build TimezoneSelector.tsx with search
3. Build BusinessHoursEditor.tsx with time pickers
4. Create StorefrontFormModal.tsx with validation
5. Wire up create/edit buttons in StorefrontManagement.tsx
6. Test full CRUD flow

**First task:** Create `frontend/src/components/ui/Modal.tsx`
