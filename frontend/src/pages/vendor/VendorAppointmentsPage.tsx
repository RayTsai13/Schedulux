import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { useStorefronts } from '../../hooks/useStorefronts';
import { useStorefrontAppointments } from '../../hooks/useAppointments';
import DashboardLayout from '../../components/layout/DashboardLayout';
import AppointmentDetailModal from '../../components/vendor/AppointmentDetailModal';
import type { Appointment, Storefront } from '../../services/api';

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
  pending:   { bg: 'bg-tertiary-fixed', text: 'text-on-tertiary-fixed', pulse: true },
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
  { id: 'pending', label: 'Pending' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

// ---------------------------------------------------------------------------
// Aggregated appointments hook — fetches across all storefronts
// ---------------------------------------------------------------------------
function useAggregatedAppointments(storefronts: Storefront[] | undefined) {
  // Create individual hooks for up to 10 storefronts
  const ids = useMemo(() => (storefronts || []).slice(0, 10).map(s => s.id), [storefronts]);

  const q0 = useStorefrontAppointments(ids[0] ?? null);
  const q1 = useStorefrontAppointments(ids[1] ?? null);
  const q2 = useStorefrontAppointments(ids[2] ?? null);
  const q3 = useStorefrontAppointments(ids[3] ?? null);
  const q4 = useStorefrontAppointments(ids[4] ?? null);

  const queries = [q0, q1, q2, q3, q4].slice(0, ids.length);
  const isLoading = queries.some(q => q.isLoading);

  const appointments = useMemo(() => {
    const all: Appointment[] = [];
    queries.forEach((q) => {
      if (q.data) all.push(...q.data);
    });
    return all.sort(
      (a, b) => new Date(b.requested_start_datetime).getTime() - new Date(a.requested_start_datetime).getTime()
    );
  }, [queries.map(q => q.data)]);

  return { appointments, isLoading };
}

// ---------------------------------------------------------------------------
// VendorAppointmentsPage
// ---------------------------------------------------------------------------
export default function VendorAppointmentsPage() {
  const { data: storefronts, isLoading: storefrontsLoading } = useStorefronts();
  const { appointments, isLoading: appointmentsLoading } = useAggregatedAppointments(storefronts);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const isLoading = storefrontsLoading || appointmentsLoading;

  if (isLoading) {
    return (
      <DashboardLayout title="Appointments">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  // Filtering
  const filtered = statusFilter === 'all'
    ? appointments
    : appointments.filter(a => a.status === statusFilter);

  // Stats
  const pendingCount = appointments.filter(a => a.status === 'pending').length;
  const confirmedCount = appointments.filter(a => a.status === 'confirmed').length;
  const completedCount = appointments.filter(a => a.status === 'completed').length;
  const totalRevenue = appointments
    .filter(a => a.status === 'completed')
    .reduce((sum, a) => sum + (a.price_final ?? a.price_quoted ?? 0), 0);

  return (
    <DashboardLayout title="Appointments">
      <div className="space-y-12">

        {/* ============================================================
         * EDITORIAL HEADER
         * ============================================================ */}
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="max-w-2xl">
            <span className="text-tertiary font-label font-semibold tracking-wider text-xs uppercase mb-4 block">
              Booking Management
            </span>
            <h2 className="text-4xl font-headline font-extrabold text-primary leading-tight tracking-tighter">
              All Appointments
            </h2>
            <p className="mt-3 text-on-surface-variant text-lg font-body max-w-lg leading-relaxed">
              A consolidated view of bookings across all your storefronts. Review, confirm, and manage client sessions.
            </p>
          </div>
        </header>

        {/* ============================================================
         * METRIC STRIP
         * ============================================================ */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-surface-container-lowest p-6 rounded-xl" style={{ borderBottom: '2px solid rgba(191,201,195,0.15)' }}>
            <span className="text-on-surface-variant text-[10px] font-label tracking-widest uppercase">Pending</span>
            <h3 className="text-3xl font-bold font-headline text-tertiary mt-1">{pendingCount}</h3>
          </div>
          <div className="bg-surface-container-lowest p-6 rounded-xl" style={{ borderBottom: '2px solid rgba(191,201,195,0.15)' }}>
            <span className="text-on-surface-variant text-[10px] font-label tracking-widest uppercase">Confirmed</span>
            <h3 className="text-3xl font-bold font-headline text-primary mt-1">{confirmedCount}</h3>
          </div>
          <div className="bg-surface-container-lowest p-6 rounded-xl" style={{ borderBottom: '2px solid rgba(191,201,195,0.15)' }}>
            <span className="text-on-surface-variant text-[10px] font-label tracking-widest uppercase">Completed</span>
            <h3 className="text-3xl font-bold font-headline text-secondary mt-1">{completedCount}</h3>
          </div>
          <div className="bg-primary p-6 rounded-xl text-on-primary">
            <span className="text-on-primary-container text-[10px] font-label tracking-widest uppercase">Revenue</span>
            <h3 className="text-3xl font-bold font-headline mt-1">${totalRevenue.toLocaleString()}</h3>
          </div>
        </section>

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
              {opt.id === 'pending' && pendingCount > 0 && (
                <span className="ml-1.5 w-2 h-2 bg-tertiary rounded-full inline-block animate-pulse" />
              )}
            </button>
          ))}
        </div>

        {/* ============================================================
         * APPOINTMENTS LIST
         * ============================================================ */}
        {filtered.length === 0 ? (
          <div
            className="bg-surface-container-lowest rounded-xl p-16 text-center"
            style={{ boxShadow: '0 20px 40px rgba(27,28,26,0.05)' }}
          >
            <Icon name="event_available" className="text-7xl text-outline mb-6" />
            <h3 className="text-2xl font-bold text-primary mb-3 font-headline">
              {statusFilter === 'all' ? 'No appointments yet' : `No ${statusFilter} appointments`}
            </h3>
            <p className="text-on-surface-variant mb-8 max-w-md mx-auto leading-relaxed">
              {statusFilter === 'all'
                ? 'Appointments will appear here when clients book your services.'
                : `You don't have any ${statusFilter} appointments right now.`}
            </p>
            {statusFilter !== 'all' && (
              <button
                onClick={() => setStatusFilter('all')}
                className="text-primary font-bold text-sm hover:underline underline-offset-4"
              >
                View all appointments
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Table header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 text-[10px] font-label text-on-surface-variant uppercase tracking-widest">
              <span className="col-span-3">Client / Service</span>
              <span className="col-span-2">Storefront</span>
              <span className="col-span-2">Date</span>
              <span className="col-span-2">Time</span>
              <span className="col-span-1">Price</span>
              <span className="col-span-1">Status</span>
              <span className="col-span-1"></span>
            </div>

            {filtered.map((apt) => {
              const cfg = STATUS_CFG[apt.status] || STATUS_CFG.pending;
              return (
                <div
                  key={apt.id}
                  className="bg-surface-container-lowest rounded-xl p-6 md:grid md:grid-cols-12 md:gap-4 md:items-center hover:bg-surface-container-low transition-colors cursor-pointer group"
                  style={{ boxShadow: '0 8px 24px rgba(27,28,26,0.03)' }}
                  onClick={() => setSelectedAppointment(apt)}
                >
                  {/* Client / Service */}
                  <div className="col-span-3 flex items-center gap-3 mb-3 md:mb-0">
                    <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-on-secondary-container">
                        C{apt.client_id}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-primary text-sm truncate font-headline">
                        {apt.service_name || `Service #${apt.service_id}`}
                      </p>
                      <p className="text-[10px] text-on-surface-variant truncate">
                        Client #{apt.client_id}
                      </p>
                    </div>
                  </div>

                  {/* Storefront */}
                  <div className="col-span-2 mb-2 md:mb-0">
                    <p className="text-sm text-on-surface-variant truncate">
                      {apt.storefront_name || `Storefront #${apt.storefront_id}`}
                    </p>
                  </div>

                  {/* Date */}
                  <div className="col-span-2 mb-2 md:mb-0">
                    <p className="text-sm font-semibold text-on-surface">
                      {format(new Date(apt.requested_start_datetime), 'MMM d, yyyy')}
                    </p>
                  </div>

                  {/* Time */}
                  <div className="col-span-2 mb-2 md:mb-0">
                    <p className="text-sm text-on-surface-variant">
                      {format(new Date(apt.requested_start_datetime), 'h:mm a')}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="col-span-1 mb-2 md:mb-0">
                    <p className="text-sm font-bold text-primary">
                      {apt.price_quoted ? `$${apt.price_quoted}` : '—'}
                    </p>
                  </div>

                  {/* Status */}
                  <div className="col-span-1 mb-2 md:mb-0">
                    <span className={`${cfg.bg} ${cfg.text} px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1`}>
                      {cfg.pulse && <span className="w-1.5 h-1.5 bg-tertiary rounded-full animate-pulse" />}
                      {cfg.icon && <Icon name={cfg.icon} fill className="text-[10px]" />}
                      {apt.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Action */}
                  <div className="col-span-1 text-right">
                    <Icon name="arrow_forward" className="text-sm text-on-surface-variant group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Appointment Detail Modal */}
      {selectedAppointment && (
        <AppointmentDetailModal
          isOpen={!!selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          appointment={selectedAppointment}
          storefrontId={selectedAppointment.storefront_id}
        />
      )}
    </DashboardLayout>
  );
}
