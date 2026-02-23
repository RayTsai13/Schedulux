import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, momentLocalizer, View } from 'react-big-calendar';
import moment from 'moment';
import { ArrowLeft, Filter } from 'lucide-react';
import { useStorefront } from '../../hooks/useStorefronts';
import { useStorefrontAppointments } from '../../hooks/useAppointments';
import AppScaffold from '../../components/layout/AppScaffold';
import UniversalButton from '../../components/universal/UniversalButton';
import AppointmentDetailModal from '../../components/vendor/AppointmentDetailModal';
import type { Appointment } from '../../services/api';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

// Status color mapping
const STATUS_COLORS = {
  pending: '#f59e0b', // amber
  confirmed: '#3b82f6', // blue
  completed: '#10b981', // green
  cancelled: '#ef4444', // red
  declined: '#6b7280', // gray
};

export default function AppointmentCalendarPage() {
  const { id } = useParams<{ id: string }>();
  const storefrontId = id ? parseInt(id) : null;

  const { data: storefront } = useStorefront(storefrontId);
  const { data: appointments, isLoading } = useStorefrontAppointments(storefrontId);

  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());

  // Convert appointments to calendar events
  const events = useMemo(() => {
    if (!appointments) return [];

    return appointments
      .filter((apt) => statusFilter === 'all' || apt.status === statusFilter)
      .map((apt) => ({
        id: apt.id,
        title: `${apt.status.charAt(0).toUpperCase() + apt.status.slice(1)} Appointment`,
        start: new Date(apt.requested_start_datetime),
        end: new Date(apt.requested_end_datetime),
        resource: apt,
      }));
  }, [appointments, statusFilter]);

  // Custom event styling
  const eventStyleGetter = (event: any) => {
    const appointment: Appointment = event.resource;
    const backgroundColor = STATUS_COLORS[appointment.status] || STATUS_COLORS.pending;

    return {
      style: {
        backgroundColor,
        borderRadius: '6px',
        opacity: 0.9,
        color: 'white',
        border: 'none',
        display: 'block',
        padding: '4px 8px',
      },
    };
  };

  const handleSelectEvent = (event: any) => {
    setSelectedAppointment(event.resource);
  };

  const handleCloseModal = () => {
    setSelectedAppointment(null);
  };

  if (isLoading) {
    return (
      <AppScaffold>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-v3-accent border-r-transparent" />
            <p className="mt-4 text-v3-secondary">Loading calendar...</p>
          </div>
        </div>
      </AppScaffold>
    );
  }

  return (
    <AppScaffold>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link
              to={`/dashboard/storefront/${storefrontId}`}
              className="inline-flex items-center gap-2 text-v3-secondary hover:text-v3-primary transition-colors mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Storefront
            </Link>
            <h1 className="text-4xl font-bold text-v3-primary">
              {storefront?.name} - Calendar
            </h1>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-3">
            <Filter className="w-5 h-5 text-v3-secondary" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 rounded-xl border border-v3-border bg-v3-background text-v3-primary focus:outline-none focus:ring-2 focus:ring-v3-accent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="declined">Declined</option>
            </select>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 p-4 bg-v3-surface rounded-xl border border-v3-border">
          <span className="text-sm font-medium text-v3-primary">Status:</span>
          {Object.entries(STATUS_COLORS).map(([status, color]) => (
            <div key={status} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: color }}
              />
              <span className="text-sm text-v3-secondary capitalize">{status}</span>
            </div>
          ))}
        </div>

        {/* Calendar */}
        <div className="bg-v3-surface rounded-xl border border-v3-border p-6" style={{ height: '700px' }}>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            eventPropGetter={eventStyleGetter}
            onSelectEvent={handleSelectEvent}
            view={view}
            onView={setView}
            date={date}
            onNavigate={setDate}
            views={['month', 'week', 'day', 'agenda']}
            popup
            tooltipAccessor={(event) => {
              const apt: Appointment = event.resource;
              return `${apt.status.toUpperCase()} - Click for details`;
            }}
          />
        </div>

        {/* Today Button */}
        <div className="flex justify-center">
          <UniversalButton
            variant="outline"
            onClick={() => setDate(new Date())}
          >
            Go to Today
          </UniversalButton>
        </div>
      </div>

      {/* Appointment Detail Modal */}
      {selectedAppointment && (
        <AppointmentDetailModal
          isOpen={!!selectedAppointment}
          onClose={handleCloseModal}
          appointment={selectedAppointment}
          storefrontId={storefrontId!}
        />
      )}
    </AppScaffold>
  );
}
