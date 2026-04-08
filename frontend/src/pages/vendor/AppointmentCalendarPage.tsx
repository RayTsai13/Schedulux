import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  format,
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, subMonths, isSameMonth, isSameDay, isToday,
} from 'date-fns';
import { useStorefront } from '../../hooks/useStorefronts';
import { useStorefrontAppointments } from '../../hooks/useAppointments';
import DashboardLayout from '../../components/layout/DashboardLayout';
import AppointmentDetailModal from '../../components/vendor/AppointmentDetailModal';
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
// Status badge colors for calendar dots
// ---------------------------------------------------------------------------
const DOT_COLORS: Record<string, string> = {
  pending: 'bg-tertiary-fixed',
  confirmed: 'bg-secondary-container',
  completed: 'bg-secondary-fixed',
  cancelled: 'bg-error-container',
  declined: 'bg-surface-container-high',
};

const DOT_BORDER_COLORS: Record<string, string> = {
  pending: 'border-tertiary-fixed',
  confirmed: 'border-primary-container',
  completed: 'border-secondary-fixed',
  cancelled: 'border-error-container',
  declined: 'border-surface-container-high',
};

// ---------------------------------------------------------------------------
// AppointmentCalendarPage
// ---------------------------------------------------------------------------
export default function AppointmentCalendarPage() {
  const { id } = useParams<{ id: string }>();
  const storefrontId = id ? parseInt(id) : null;

  const { data: storefront } = useStorefront(storefrontId);
  const { data: appointments, isLoading } = useStorefrontAppointments(storefrontId);

  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filter
  const filtered = useMemo(() => {
    if (!appointments) return [];
    return appointments.filter((a) => statusFilter === 'all' || a.status === statusFilter);
  }, [appointments, statusFilter]);

  // Stats
  const confirmedCount = appointments?.filter((a) => a.status === 'confirmed').length ?? 0;
  const pendingCount = appointments?.filter((a) => a.status === 'pending').length ?? 0;

  // Today's appointments
  const todayAppointments = useMemo(() => {
    if (!filtered) return [];
    const today = new Date();
    return filtered
      .filter((a) => isSameDay(new Date(a.requested_start_datetime), today))
      .sort((a, b) => new Date(a.requested_start_datetime).getTime() - new Date(b.requested_start_datetime).getTime());
  }, [filtered]);

  // Calendar grid generation
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const days: Date[] = [];
    let day = calStart;
    while (day <= calEnd) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [currentMonth]);

  // Appointments by day
  const appointmentsByDay = useMemo(() => {
    const map: Record<string, Appointment[]> = {};
    filtered.forEach((a) => {
      const key = format(new Date(a.requested_start_datetime), 'yyyy-MM-dd');
      if (!map[key]) map[key] = [];
      map[key].push(a);
    });
    return map;
  }, [filtered]);

  // Loading
  if (isLoading) {
    return (
      <DashboardLayout title="Calendar">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Calendar">
      <div className="space-y-12 pb-12">

        {/* Breadcrumb */}
        <Link
          to={`/dashboard/storefront/${storefrontId}`}
          className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors text-sm font-label"
        >
          <Icon name="arrow_back" className="text-sm" />
          Back to Storefront
        </Link>

        {/* ============================================================
         * CALENDAR CONTROLS & STATS
         * ============================================================ */}
        <section className="flex flex-col md:flex-row justify-between items-end md:items-center gap-6">
          <div>
            <h3 className="text-4xl font-extrabold text-primary font-headline mb-2">
              {format(currentMonth, 'MMMM yyyy')}
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-1 hover:bg-surface-container rounded transition-colors"
              >
                <Icon name="chevron_left" />
              </button>
              <button
                onClick={() => setCurrentMonth(new Date())}
                className="px-4 py-1 text-sm font-bold bg-surface-container-lowest border border-outline-variant/15 rounded"
              >
                Today
              </button>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-1 hover:bg-surface-container rounded transition-colors"
              >
                <Icon name="chevron_right" />
              </button>
            </div>
          </div>

          {/* Stat chips */}
          <div className="flex gap-4">
            <div className="bg-surface-container-low px-6 py-4 rounded-xl flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed">
                <Icon name="check_circle" className="text-sm" />
              </div>
              <div>
                <p className="text-xs text-on-surface-variant font-medium">Confirmed</p>
                <p className="text-xl font-bold text-primary">{confirmedCount}</p>
              </div>
            </div>
            <div className="bg-surface-container-low px-6 py-4 rounded-xl flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed">
                <Icon name="pending_actions" className="text-sm" />
              </div>
              <div>
                <p className="text-xs text-on-surface-variant font-medium">Pending</p>
                <p className="text-xl font-bold text-primary">{pendingCount}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================
         * FILTER CHIPS
         * ============================================================ */}
        <div className="flex gap-2 flex-wrap">
          {['all', 'confirmed', 'pending', 'completed', 'cancelled'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-lg text-sm font-label font-medium transition-all capitalize ${
                statusFilter === s
                  ? 'bg-secondary-container text-primary font-semibold'
                  : 'text-on-surface-variant hover:bg-surface-container-low'
              }`}
            >
              {s === 'all' ? 'All' : s}
            </button>
          ))}
        </div>

        {/* ============================================================
         * CALENDAR BENTO GRID
         * ============================================================ */}
        <section className="grid grid-cols-1 xl:grid-cols-4 gap-8">

          {/* ----- Upcoming Today sidebar ----- */}
          <div className="xl:col-span-1 space-y-6">
            <div
              className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/15"
              style={{ boxShadow: '0 20px 40px rgba(27,28,26,0.05)' }}
            >
              <h4 className="font-headline font-bold text-lg mb-6">Upcoming Today</h4>
              {todayAppointments.length === 0 ? (
                <p className="text-sm text-on-surface-variant italic">No appointments today</p>
              ) : (
                <div className="space-y-4">
                  {todayAppointments.map((apt) => (
                    <button
                      key={apt.id}
                      onClick={() => setSelectedAppointment(apt)}
                      className={`w-full text-left group relative pl-4 border-l-4 ${DOT_BORDER_COLORS[apt.status] || 'border-primary-container'} py-1 hover:bg-surface-container-low rounded-r transition-colors`}
                    >
                      <p className="text-xs font-bold text-tertiary">
                        {format(new Date(apt.requested_start_datetime), 'hh:mm a')}
                      </p>
                      <p className="font-bold text-on-surface leading-tight">
                        {apt.service_name || `Service #${apt.service_id}`}
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        Client: {apt.client_name || `#${apt.client_id}`}
                      </p>
                      <div className="mt-2 flex gap-2">
                        <span className={`text-[10px] px-2 py-0.5 ${DOT_COLORS[apt.status] || 'bg-surface-container'} rounded-full font-bold capitalize`}>
                          {apt.status}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Service Note card */}
            <div className="bg-primary text-on-primary p-6 rounded-2xl">
              <Icon name="psychology" className="mb-2 text-primary-fixed" />
              <h4 className="font-headline font-bold mb-2">Quick Actions</h4>
              <p className="text-sm text-on-primary-container mb-4">
                {storefront?.name ? `Manage ${storefront.name}'s appointments and availability from here.` : 'View and manage your storefront appointments.'}
              </p>
              <Link
                to={`/dashboard/storefront/${storefrontId}`}
                className="text-xs font-bold underline underline-offset-4 decoration-primary-fixed"
              >
                Manage Storefront →
              </Link>
            </div>
          </div>

          {/* ----- Main Calendar Grid ----- */}
          <div
            className="xl:col-span-3 bg-surface-container-lowest rounded-3xl overflow-hidden border border-outline-variant/15"
            style={{ boxShadow: '0 20px 40px rgba(27,28,26,0.03)' }}
          >
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-outline-variant/10">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                <div key={d} className="py-4 text-center text-xs font-extrabold text-on-surface-variant uppercase tracking-widest">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar cells */}
            <div className="grid grid-cols-7 auto-rows-[130px]">
              {calendarDays.map((day, i) => {
                const key = format(day, 'yyyy-MM-dd');
                const dayApts = appointmentsByDay[key] || [];
                const inMonth = isSameMonth(day, currentMonth);
                const today = isToday(day);

                return (
                  <div
                    key={i}
                    className={`p-2 border-r border-b border-outline-variant/5 flex flex-col gap-1 ${
                      !inMonth ? 'bg-surface-container-low/30 text-on-surface-variant/40' : 'text-on-surface'
                    } ${today ? 'bg-surface-container-low/50' : ''}`}
                  >
                    <span className={`text-sm font-bold ${today ? 'w-6 h-6 bg-primary text-on-primary rounded-full flex items-center justify-center text-[10px]' : ''}`}>
                      {format(day, 'd')}
                    </span>
                    {dayApts.slice(0, 2).map((apt) => (
                      <button
                        key={apt.id}
                        onClick={() => setSelectedAppointment(apt)}
                        className={`${DOT_COLORS[apt.status] || 'bg-surface-container'} p-1.5 rounded text-[10px] font-bold truncate text-left hover:opacity-80 transition-opacity`}
                      >
                        {format(new Date(apt.requested_start_datetime), 'HH:mm')}{' '}
                        {apt.service_name || 'Appt'}
                      </button>
                    ))}
                    {dayApts.length > 2 && (
                      <span className="text-[10px] text-on-surface-variant font-medium">
                        +{dayApts.length - 2} more
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ============================================================
         * BOTTOM CONTEXT BAR
         * ============================================================ */}
        <section className="bg-surface-container-low rounded-2xl p-8 flex flex-col lg:flex-row items-center justify-between gap-6 border-l-8 border-primary">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-surface-container-lowest rounded-full flex items-center justify-center border border-outline-variant/20">
              <Icon name="eco" fill className="text-3xl text-primary" />
            </div>
            <div>
              <h5 className="text-xl font-bold font-headline">
                {format(currentMonth, 'MMMM')} Resource Outlook
              </h5>
              <p className="text-on-surface-variant text-sm max-w-md leading-relaxed">
                You have {confirmedCount} confirmed and {pendingCount} pending appointment{pendingCount !== 1 ? 's' : ''} this month. Review your availability to optimize bookings.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link
              to={`/dashboard/storefront/${storefrontId}`}
              className="px-6 py-2 border border-outline-variant text-primary font-bold rounded-md hover:bg-surface-container transition-colors"
            >
              Manage Storefront
            </Link>
          </div>
        </section>
      </div>

      {/* Appointment Detail Modal */}
      {selectedAppointment && (
        <AppointmentDetailModal
          isOpen={!!selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          appointment={selectedAppointment}
          storefrontId={storefrontId!}
        />
      )}
    </DashboardLayout>
  );
}
