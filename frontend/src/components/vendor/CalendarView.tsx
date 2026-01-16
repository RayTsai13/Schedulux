import { useMemo, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, View, SlotInfo } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import { useStorefrontAppointments } from '../../hooks/useAppointments';
import { useCalendarStore } from '../../stores/useCalendarStore';
import type { Appointment } from '../../services/api';

/**
 * CalendarView - Vendor appointment calendar visualization
 *
 * Displays storefront appointments in a calendar format using react-big-calendar.
 * Integrates with Zustand store for view/navigation state persistence.
 *
 * Features:
 * - Month, Week, Day views
 * - Status-based event coloring
 * - Click handlers for viewing/editing appointments
 */

// Setup date-fns localizer for react-big-calendar
const locales = { 'en-US': enUS };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales,
});

// Calendar Event interface - transforms API data for calendar display
interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  resource: Appointment;
}

interface CalendarViewProps {
  storefrontId: number;
  onSelectEvent?: (appointment: Appointment) => void;
  onSelectSlot?: (slotInfo: { start: Date; end: Date }) => void;
}

export function CalendarView({
  storefrontId,
  onSelectEvent,
  onSelectSlot,
}: CalendarViewProps) {
  const {
    calendarView,
    selectedDate,
    setCalendarView,
    setSelectedDate,
  } = useCalendarStore();

  // Fetch appointments for the storefront
  const { data: appointments = [], isLoading } = useStorefrontAppointments(storefrontId);

  // Transform API data to Calendar events
  // CRITICAL: Convert ISO strings to Date objects for react-big-calendar
  const events: CalendarEvent[] = useMemo(() => {
    return appointments.map((apt) => ({
      id: apt.id,
      title: `Service #${apt.service_id}${apt.client_notes ? ' - ' + apt.client_notes.substring(0, 20) : ''}`,
      // Priority: Use confirmed times if available, otherwise requested times
      start: new Date(apt.confirmed_start_datetime || apt.requested_start_datetime),
      end: new Date(apt.confirmed_end_datetime || apt.requested_end_datetime),
      resource: apt,
    }));
  }, [appointments]);

  // Status-based event styling with Tailwind-like colors
  const eventPropGetter = useCallback((event: CalendarEvent) => {
    const status = event.resource.status;

    // Define status-specific styles
    const statusStyles: Record<string, React.CSSProperties> = {
      pending: {
        backgroundColor: '#FEF3C7',
        color: '#92400E',
        borderLeft: '4px solid #F59E0B',
      },
      confirmed: {
        backgroundColor: '#DBEAFE',
        color: '#1E40AF',
        borderLeft: '4px solid #3B82F6',
      },
      completed: {
        backgroundColor: '#D1FAE5',
        color: '#065F46',
        borderLeft: '4px solid #10B981',
      },
      cancelled: {
        backgroundColor: '#F3F4F6',
        color: '#6B7280',
        borderLeft: '4px solid #9CA3AF',
        opacity: 0.75,
      },
      no_show: {
        backgroundColor: '#FEE2E2',
        color: '#991B1B',
        borderLeft: '4px solid #EF4444',
      },
    };

    return {
      style: {
        ...statusStyles[status],
        borderRadius: '4px',
        padding: '2px 4px',
        fontSize: '12px',
        fontWeight: 500,
      },
    };
  }, []);

  // Event click handler - open detail/edit view
  const handleSelectEvent = useCallback(
    (event: CalendarEvent) => {
      console.log('Selected appointment:', event.id, event.resource);
      if (onSelectEvent) {
        onSelectEvent(event.resource);
      }
    },
    [onSelectEvent]
  );

  // Slot click handler - for creating new appointments
  const handleSelectSlot = useCallback(
    (slotInfo: SlotInfo) => {
      console.log('Selected slot:', slotInfo.start, slotInfo.end);
      if (onSelectSlot) {
        onSelectSlot({ start: slotInfo.start, end: slotInfo.end });
      }
    },
    [onSelectSlot]
  );

  // View change handler - sync with Zustand store
  const handleViewChange = useCallback(
    (view: View) => {
      setCalendarView(view as 'day' | 'week' | 'month');
    },
    [setCalendarView]
  );

  // Navigation handler - sync with Zustand store
  const handleNavigate = useCallback(
    (date: Date) => {
      setSelectedDate(date);
    },
    [setSelectedDate]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-200px)] min-h-[500px]">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        view={calendarView}
        date={selectedDate}
        onView={handleViewChange}
        onNavigate={handleNavigate}
        onSelectEvent={handleSelectEvent}
        onSelectSlot={handleSelectSlot}
        selectable
        eventPropGetter={eventPropGetter}
        min={new Date(1970, 1, 1, 6, 0, 0)} // 6 AM
        max={new Date(1970, 1, 1, 22, 0, 0)} // 10 PM
        views={['month', 'week', 'day']}
        defaultView="week"
        toolbar={true}
        popup={true}
        step={30}
        timeslots={2}
      />
    </div>
  );
}

export default CalendarView;
