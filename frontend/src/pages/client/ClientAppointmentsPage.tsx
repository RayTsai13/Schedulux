import { useState } from 'react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useClientAppointments, useUpdateAppointmentStatus } from '../../hooks/useAppointments';
import AppScaffold from '../../components/layout/AppScaffold';
import RescheduleModal from '../../components/booking/RescheduleModal';
import type { Appointment } from '../../services/api';

// ---------------------------------------------------------------------------
// Icon helper
// ---------------------------------------------------------------------------
function Icon({ name, className = '', fill = false }: { name: string; className?: string; fill?: boolean }) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={fill ? { fontVariationSettings: "'FILL' 1" } : undefined}
    >
      {name}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Status badge config
// ---------------------------------------------------------------------------
const STATUS_CFG: Record<string, { bg: string; text: string; icon?: string; pulse?: boolean }> = {
  pending:   { bg: 'bg-tertiary-fixed', text: 'text-on-tertiary-fixed', icon: undefined, pulse: true },
  confirmed: { bg: 'bg-secondary-container', text: 'text-on-secondary-container', icon: 'check_circle' },
  completed: { bg: 'bg-secondary-fixed', text: 'text-on-secondary-fixed', icon: 'task_alt' },
  cancelled: { bg: 'bg-error-container', text: 'text-on-error-container', icon: 'cancel' },
  declined:  { bg: 'bg-surface-container-high', text: 'text-on-surface-variant', icon: 'block' },
};

// ---------------------------------------------------------------------------
// Filter chip options
// ---------------------------------------------------------------------------
const FILTER_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'past', label: 'Past' },
  { id: 'pending', label: 'Pending' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

// ---------------------------------------------------------------------------
// ClientAppointmentsPage
// ---------------------------------------------------------------------------
export default function ClientAppointmentsPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null);
  const { data: appointments, isLoading } = useClientAppointments();
  const updateStatus = useUpdateAppointmentStatus();

  const handleCancelAppointment = async (appointmentId: number) => {
    if (confirm('Are you sure you want to cancel this appointment?')) {
      try {
        await updateStatus.mutateAsync({ id: appointmentId, data: { status: 'cancelled' } });
      } catch (error) {
        console.error('Failed to cancel appointment:', error);
      }
    }
  };

  // Filter
  const filteredAppointments = appointments?.filter((apt) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'upcoming')
      return (apt.status === 'pending' || apt.status === 'confirmed') && new Date(apt.requested_start_datetime) > new Date();
    if (statusFilter === 'past')
      return apt.status === 'completed' || (apt.status === 'confirmed' && new Date(apt.requested_start_datetime) < new Date());
    return apt.status === statusFilter;
  });

  // Sort (most recent first)
  const sorted = [...(filteredAppointments || [])].sort(
    (a, b) => new Date(b.requested_start_datetime).getTime() - new Date(a.requested_start_datetime).getTime()
  );

  // Stats
  const activeCount = appointments?.filter((a) => a.status === 'pending' || a.status === 'confirmed').length ?? 0;
  const pendingCount = appointments?.filter((a) => a.status === 'pending').length ?? 0;
  const completedCount = appointments?.filter((a) => a.status === 'completed').length ?? 0;

  // Has pending banner?
  const hasPending = pendingCount > 0;

  // Loading
  if (isLoading) {
    return (
      <AppScaffold>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AppScaffold>
    );
  }

  return (
    <AppScaffold>
      <div className="max-w-6xl mx-auto space-y-12 pt-8 pb-24">

        {/* ============================================================
         * EDITORIAL HEADER
         * ============================================================ */}
        <header>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="max-w-2xl">
              <span className="text-tertiary font-label font-semibold tracking-wider text-xs uppercase mb-4 block">
                Schedule Management
              </span>
              <h1 className="text-5xl font-headline font-extrabold text-primary leading-tight tracking-tighter">
                Your Appointments
              </h1>
              <p className="mt-4 text-on-surface-variant text-lg font-body max-w-lg leading-relaxed">
                Track your upcoming consultations and service requests. Rooted in efficiency and clarity.
              </p>
            </div>
            <button
              onClick={() => navigate('/explore')}
              className="bg-secondary-container text-on-secondary-container px-5 py-2.5 rounded-md font-medium text-sm flex items-center gap-2 hover:opacity-90 transition-opacity shrink-0"
            >
              <Icon name="explore" className="text-lg" />
              Browse Services
            </button>
          </div>
        </header>

        {/* ============================================================
         * NOTIFICATION BANNER (if pending)
         * ============================================================ */}
        {hasPending && (
          <div
            className="bg-tertiary-fixed rounded-xl p-6 flex items-center gap-4 border border-tertiary-fixed-dim/20"
            style={{ boxShadow: '0 20px 40px rgba(27,28,26,0.05)' }}
          >
            <div className="bg-tertiary-container p-2 rounded-full flex items-center justify-center">
              <Icon name="info" fill className="text-on-tertiary-container" />
            </div>
            <div>
              <p className="text-on-tertiary-fixed font-semibold">Awaiting vendor confirmation</p>
              <p className="text-on-tertiary-fixed-variant text-sm">
                {pendingCount} of your request{pendingCount > 1 ? 's are' : ' is'} currently being reviewed.
              </p>
            </div>
          </div>
        )}

        {/* ============================================================
         * FILTER CHIPS
         * ============================================================ */}
        <div className="flex gap-2 flex-wrap">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setStatusFilter(opt.id)}
              className={`px-4 py-2 rounded-lg text-sm font-label font-medium transition-all ${
                statusFilter === opt.id
                  ? 'bg-secondary-container text-primary font-semibold'
                  : 'text-on-surface-variant hover:bg-surface-container-low'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* ============================================================
         * APPOINTMENTS GRID   (8-col cards + 4-col sidebar)
         * ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* ----- Card list ----- */}
          <div className="lg:col-span-8 space-y-8">
            {sorted.length === 0 ? (
              <div
                className="bg-surface-container-lowest rounded-xl p-12 text-center"
                style={{ boxShadow: '0 20px 40px rgba(27,28,26,0.05)' }}
              >
                <Icon name="calendar_month" className="text-6xl text-outline mb-6" />
                <h3 className="text-2xl font-headline font-bold text-primary mb-2">No appointments found</h3>
                <p className="text-on-surface-variant mb-6 max-w-sm mx-auto">
                  {statusFilter === 'all'
                    ? "You haven't booked any appointments yet. Explore local services to get started."
                    : `No ${statusFilter} appointments right now.`}
                </p>
                <button
                  onClick={() => navigate('/explore')}
                  className="bg-primary text-on-primary px-8 py-3 rounded-md font-bold hover:bg-primary-container transition-all"
                >
                  Explore Services
                </button>
              </div>
            ) : (
              sorted.map((apt) => (
                <AppointmentCard
                  key={apt.id}
                  appointment={apt}
                  onCancel={handleCancelAppointment}
                  onReschedule={setRescheduleTarget}
                />
              ))
            )}
          </div>

          {/* ----- Sidebar ----- */}
          <aside className="lg:col-span-4 space-y-8">
            {/* Summary Card */}
            <div className="bg-surface-container-low rounded-xl p-8">
              <h4 className="font-headline font-bold text-primary mb-6">Appointment Summary</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-outline-variant/20">
                  <span className="text-on-surface-variant">Active Requests</span>
                  <span className="font-bold text-primary">{String(activeCount).padStart(2, '0')}</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-outline-variant/20">
                  <span className="text-on-surface-variant">Pending Approval</span>
                  <span className="font-bold text-tertiary">{String(pendingCount).padStart(2, '0')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant">Completed</span>
                  <span className="font-bold text-secondary">{String(completedCount).padStart(2, '0')}</span>
                </div>
              </div>
              <button
                onClick={() => navigate('/explore')}
                className="w-full mt-8 bg-primary text-on-primary py-3 rounded-md font-bold hover:bg-primary-container transition-all"
              >
                Book New Service
              </button>
            </div>

            {/* Tip Card */}
            <div className="relative overflow-hidden bg-primary text-on-primary rounded-xl p-8">
              <div className="relative z-10">
                <Icon name="lightbulb" className="text-on-primary-container mb-4 block" />
                <h5 className="font-headline font-bold text-lg mb-2 text-on-primary-container">Naturalist Tip</h5>
                <p className="text-on-primary-container text-sm leading-relaxed opacity-90">
                  Provide photos of your space before your consultation to help specialists understand your needs better.
                </p>
              </div>
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-primary-container rounded-full blur-3xl opacity-50" />
            </div>
          </aside>
        </div>
      </div>

      {/* Reschedule Modal */}
      {rescheduleTarget && (
        <RescheduleModal
          isOpen={!!rescheduleTarget}
          onClose={() => setRescheduleTarget(null)}
          appointment={rescheduleTarget}
        />
      )}
    </AppScaffold>
  );
}

// ===========================================================================
// Appointment Card
// ===========================================================================
interface AppointmentCardProps {
  appointment: Appointment;
  onCancel: (id: number) => void;
  onReschedule: (appointment: Appointment) => void;
}

function AppointmentCard({ appointment, onCancel, onReschedule }: AppointmentCardProps) {
  const cfg = STATUS_CFG[appointment.status] || STATUS_CFG.pending;
  const canAct = (appointment.status === 'pending' || appointment.status === 'confirmed') &&
    new Date(appointment.requested_start_datetime) > new Date();

  return (
    <article
      className="bg-surface-container-lowest rounded-xl p-8 group border-b-2 border-transparent focus-within:border-primary transition-all"
      style={{ boxShadow: '0 20px 40px rgba(27,28,26,0.05)' }}
    >
      {/* Top row: title + badge */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex gap-4 items-center">
          <div className="w-14 h-14 rounded-full bg-surface-container-low flex items-center justify-center">
            <Icon name="calendar_today" className="text-xl text-primary" />
          </div>
          <div>
            <h3 className="font-headline text-xl font-bold text-primary">
              {appointment.service_name || `Service #${appointment.service_id}`}
            </h3>
            <p className="text-on-surface-variant text-sm">
              {appointment.storefront_name || `Storefront #${appointment.storefront_id}`}
            </p>
          </div>
        </div>
        <span className={`${cfg.bg} ${cfg.text} px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5`}>
          {cfg.pulse && <span className="w-2 h-2 bg-tertiary rounded-full animate-pulse" />}
          {cfg.icon && <Icon name={cfg.icon} fill className="text-xs" />}
          {appointment.status.toUpperCase()}
        </span>
      </div>

      {/* Detail row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6 border-y border-outline-variant/15">
        <div className="flex items-center gap-3">
          <Icon name="event" className="text-tertiary" />
          <div>
            <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-widest">Date</p>
            <p className="font-semibold text-on-surface">
              {format(new Date(appointment.requested_start_datetime), 'MMMM d, yyyy')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Icon name="schedule" className="text-tertiary" />
          <div>
            <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-widest">Time</p>
            <p className="font-semibold text-on-surface">
              {format(new Date(appointment.requested_start_datetime), 'h:mm a')} — {format(new Date(appointment.requested_end_datetime), 'h:mm a')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Icon name="location_on" className="text-tertiary" />
          <div>
            <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-widest">Location</p>
            <p className="font-semibold text-on-surface">
              {appointment.service_location_type === 'at_vendor'
                ? 'At business location'
                : appointment.service_location_type === 'at_client' && appointment.client_address
                ? `At your location`
                : 'Location TBD'}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="mt-6 flex flex-wrap gap-4 items-center justify-between">
        {appointment.client_notes && (
          <p className="text-sm text-on-surface-variant italic">"{appointment.client_notes}"</p>
        )}
        {canAct && (
          <div className="flex gap-3 ml-auto">
            <button
              onClick={() => onReschedule(appointment)}
              className="text-on-surface-variant hover:text-primary text-sm font-semibold transition-colors"
            >
              Reschedule
            </button>
            <button
              onClick={() => onCancel(appointment.id)}
              className="text-on-surface-variant hover:text-error text-sm font-semibold transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
