import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow, startOfWeek, addDays, isSameDay } from 'date-fns';
import { useStorefronts } from '../../hooks/useStorefronts';
import { useStorefrontAppointments } from '../../hooks/useAppointments';
import { useAuth } from '../../hooks/useAuth';
import DashboardLayout from '../../components/layout/DashboardLayout';
import CreateStorefrontModal from '../../components/vendor/CreateStorefrontModal';
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
// Aggregated appointments hook — fetches across all storefronts
// ---------------------------------------------------------------------------
function useAllAppointments(storefronts: Storefront[] | undefined) {
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
    return all;
  }, [queries.map(q => q.data)]);

  return { appointments, isLoading };
}

// ---------------------------------------------------------------------------
// Day labels
// ---------------------------------------------------------------------------
const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

// ---------------------------------------------------------------------------
// VendorDashboardPage
// ---------------------------------------------------------------------------
export default function VendorDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: storefronts, isLoading: storefrontsLoading } = useStorefronts();
  const { appointments, isLoading: appointmentsLoading } = useAllAppointments(storefronts);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const isLoading = storefrontsLoading || appointmentsLoading;

  // --- Computed metrics from real data ---
  const metrics = useMemo(() => {
    const now = new Date();
    const totalRevenue = appointments
      .filter(a => a.status === 'completed')
      .reduce((sum, a) => sum + (a.price_final ?? a.price_quoted ?? 0), 0);

    const totalAppointments = appointments.filter(
      a => a.status !== 'cancelled' && a.status !== 'declined'
    ).length;

    // Upcoming appointments (confirmed or pending, in the future)
    const upcoming = appointments
      .filter(a =>
        (a.status === 'confirmed' || a.status === 'pending') &&
        new Date(a.requested_start_datetime) > now
      )
      .sort((a, b) =>
        new Date(a.requested_start_datetime).getTime() - new Date(b.requested_start_datetime).getTime()
      )
      .slice(0, 4);

    // Recent activity — last 5 appointments sorted by newest
    const recentActivity = [...appointments]
      .sort((a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      )
      .slice(0, 5);

    // Weekly chart: count appointments per day of current week
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
    const weekCounts = DAYS.map((_, i) => {
      const day = addDays(weekStart, i);
      return appointments.filter(a =>
        isSameDay(new Date(a.requested_start_datetime), day) &&
        a.status !== 'cancelled' && a.status !== 'declined'
      ).length;
    });
    const maxCount = Math.max(...weekCounts, 1);

    return { totalRevenue, totalAppointments, upcoming, recentActivity, weekCounts, maxCount };
  }, [appointments]);

  // Loading state
  if (isLoading) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  const storefrontCount = storefronts?.length ?? 0;

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-12">

        {/* ============================================================
         * METRIC BENTO GRID
         * ============================================================ */}
        <section className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {/* Total Revenue — Hero card */}
          <div className="col-span-1 md:col-span-2 bg-primary p-8 rounded-xl flex flex-col justify-between text-on-primary min-h-[200px] relative overflow-hidden group">
            <div className="relative z-10">
              <span className="text-on-primary-container text-xs font-label tracking-widest uppercase">
                Total Revenue
              </span>
              <h2 className="text-5xl font-bold font-headline mt-2 tracking-tight">
                ${metrics.totalRevenue.toLocaleString()}
              </h2>
              <div className="flex items-center gap-2 mt-4 text-on-primary-container text-sm">
                <Icon name="payments" className="text-sm" />
                <span>From {appointments.filter(a => a.status === 'completed').length} completed sessions</span>
              </div>
            </div>
            <div className="absolute right-0 bottom-0 opacity-10 group-hover:scale-110 transition-transform duration-700">
              <Icon name="eco" className="text-[160px]" />
            </div>
          </div>

          {/* Active Storefronts */}
          <div className="bg-surface-container-lowest p-8 rounded-xl flex flex-col justify-between min-h-[200px]" style={{ borderBottom: '2px solid rgba(191,201,195,0.15)' }}>
            <div>
              <span className="text-on-surface-variant text-xs font-label tracking-widest uppercase">
                Active Storefronts
              </span>
              <h2 className="text-4xl font-bold font-headline mt-2 text-primary">
                {storefrontCount}
              </h2>
            </div>
            {storefrontCount > 0 && storefronts && (
              <div className="flex flex-wrap gap-2 mt-4">
                {storefronts.slice(0, 3).map((sf) => (
                  <span
                    key={sf.id}
                    className="px-2 py-1 bg-secondary-container text-on-secondary-container text-[10px] font-bold rounded uppercase tracking-wider truncate max-w-[120px]"
                  >
                    {sf.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Appointments count */}
          <div className="bg-surface-container-low p-8 rounded-xl flex flex-col justify-between min-h-[200px]">
            <div>
              <span className="text-on-surface-variant text-xs font-label tracking-widest uppercase">
                Appointments
              </span>
              <h2 className="text-4xl font-bold font-headline mt-2 text-primary">
                {metrics.totalAppointments}
              </h2>
            </div>
            <p className="text-on-surface-variant text-xs font-body leading-relaxed">
              Total sessions across all storefronts.
            </p>
          </div>
        </section>

        {/* ============================================================
         * MAIN 12-COLUMN SECTION
         * ============================================================ */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* ---- Left 8-col: Chart + Upcoming ---- */}
          <div className="lg:col-span-8 space-y-12">

            {/* Weekly Appointments Chart */}
            <div>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold font-headline text-primary">This Week</h3>
                <span className="px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold uppercase tracking-wider">
                  Appointments
                </span>
              </div>
              <div className="aspect-[16/7] bg-surface-container-lowest rounded-xl p-8 relative overflow-hidden">
                {/* Bar chart from real data */}
                <div className="absolute inset-x-8 bottom-8 top-16 flex items-end justify-between gap-4">
                  {metrics.weekCounts.map((count, i) => {
                    const heightPct = metrics.maxCount > 0 ? (count / metrics.maxCount) * 100 : 0;
                    const isMax = count === metrics.maxCount && count > 0;
                    return (
                      <div
                        key={i}
                        className={`w-full rounded-t-sm transition-all hover:opacity-80 ${
                          isMax ? 'bg-primary' : count > 0 ? 'bg-secondary-container/60' : 'bg-secondary-container/15'
                        }`}
                        style={{ height: `${Math.max(heightPct, 4)}%` }}
                      />
                    );
                  })}
                </div>
                {/* Day labels */}
                <div className="flex justify-between text-[10px] font-label text-on-surface-variant mt-2 absolute bottom-2 inset-x-8">
                  {DAYS.map((d, i) => (
                    <span key={d} className={metrics.weekCounts[i] > 0 ? 'text-primary font-bold' : ''}>
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Upcoming Appointments — from real data */}
            <div>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold font-headline text-primary">
                  Upcoming Appointments
                </h3>
                {metrics.upcoming.length > 0 && (
                  <button
                    onClick={() => navigate('/dashboard/appointments')}
                    className="text-sm font-bold text-primary hover:underline underline-offset-4"
                  >
                    View All
                  </button>
                )}
              </div>
              {metrics.upcoming.length === 0 ? (
                <div className="p-8 bg-surface-container-low rounded-xl text-center">
                  <Icon name="event" className="text-4xl text-outline mb-4" />
                  <p className="text-on-surface-variant">No upcoming appointments.</p>
                  <p className="text-on-surface-variant text-sm mt-1">
                    Appointments will appear here when clients book your services.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {metrics.upcoming.map((apt) => {
                    const dt = new Date(apt.requested_start_datetime);
                    return (
                      <div
                        key={apt.id}
                        onClick={() => navigate(`/dashboard/storefront/${apt.storefront_id}/calendar`)}
                        className="flex gap-6 p-6 bg-surface-container-low rounded-xl group hover:bg-surface-container-lowest transition-colors cursor-pointer"
                      >
                        <div className="shrink-0 text-center">
                          <span className="block text-tertiary font-bold text-lg font-headline">
                            {format(dt, 'MMM').toUpperCase()}
                          </span>
                          <span className="block text-3xl font-extrabold text-primary font-headline">
                            {format(dt, 'd')}
                          </span>
                        </div>
                        <div className="space-y-2 min-w-0">
                          <h4 className="font-bold text-on-surface text-lg leading-tight truncate">
                            {apt.service_name || `Service #${apt.service_id}`}
                          </h4>
                          <p className="text-sm text-on-surface-variant truncate">
                            {apt.storefront_name || `Storefront #${apt.storefront_id}`}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-primary font-bold pt-2">
                            <Icon name="schedule" className="text-sm" />
                            <span>{format(dt, 'h:mm a')}</span>
                            <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              apt.status === 'confirmed'
                                ? 'bg-secondary-container text-on-secondary-container'
                                : 'bg-tertiary-fixed text-on-tertiary-fixed'
                            }`}>
                              {apt.status.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Storefronts Quick Access */}
            {storefronts && storefronts.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-bold font-headline text-primary">My Storefronts</h3>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-1 text-sm font-bold text-primary hover:underline underline-offset-4"
                  >
                    <Icon name="add" className="text-sm" />
                    New Storefront
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {storefronts.map((sf) => (
                    <div
                      key={sf.id}
                      onClick={() => navigate(`/dashboard/storefront/${sf.id}`)}
                      className="p-6 bg-surface-container-lowest rounded-xl cursor-pointer hover:bg-surface-container-low transition-colors group"
                      style={{ borderBottom: '2px solid rgba(191,201,195,0.15)' }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-bold text-primary text-lg group-hover:text-tertiary transition-colors font-headline">
                          {sf.name}
                        </h4>
                        <span className="px-2 py-1 bg-secondary-container text-on-secondary-container text-[10px] font-bold rounded uppercase tracking-wider">
                          {sf.location_type}
                        </span>
                      </div>
                      {sf.description && (
                        <p className="text-sm text-on-surface-variant line-clamp-2 mb-3">
                          {sf.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid rgba(191,201,195,0.15)' }}>
                        <span className="text-xs text-on-surface-variant flex items-center gap-1">
                          <Icon name="location_on" fill className="text-xs" />
                          {sf.city || 'Location not set'}{sf.state ? `, ${sf.state}` : ''}
                        </span>
                        <span className="text-primary text-sm font-bold flex items-center gap-1">
                          Manage
                          <Icon name="arrow_forward" className="text-sm group-hover:translate-x-1 transition-transform" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state for no storefronts */}
            {(!storefronts || storefronts.length === 0) && (
              <div className="p-12 bg-surface-container-lowest rounded-xl text-center" style={{ borderBottom: '2px solid rgba(191,201,195,0.15)' }}>
                <Icon name="storefront" className="text-6xl text-outline mb-6" />
                <h3 className="text-2xl font-bold text-primary mb-2 font-headline">
                  No storefronts yet
                </h3>
                <p className="text-on-surface-variant mb-8">
                  Create your first storefront to start accepting bookings
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-primary text-on-primary font-headline font-bold py-3 px-8 rounded-lg hover:bg-primary-container transition-all flex items-center justify-center gap-2 group mx-auto active:scale-[0.98]"
                >
                  <Icon name="add" className="text-lg" />
                  Create Storefront
                </button>
              </div>
            )}
          </div>

          {/* ---- Right 4-col: Activity + Support ---- */}
          <div className="lg:col-span-4 space-y-12">

            {/* Recent Activity — from real data */}
            <div className="bg-surface-container-lowest p-8 rounded-xl" style={{ borderBottom: '2px solid rgba(191,201,195,0.15)' }}>
              <h3 className="text-xl font-bold font-headline text-primary mb-6">Recent Activity</h3>
              {metrics.recentActivity.length === 0 ? (
                <p className="text-sm text-on-surface-variant py-4">
                  No activity yet. Activity will appear here as appointments are created and updated.
                </p>
              ) : (
                <div className="space-y-6">
                  {metrics.recentActivity.map((apt) => {
                    const statusColors: Record<string, string> = {
                      pending: 'bg-tertiary-fixed',
                      confirmed: 'bg-secondary',
                      completed: 'bg-secondary-fixed',
                      cancelled: 'bg-error-container',
                      declined: 'bg-outline-variant',
                    };
                    const actionText: Record<string, string> = {
                      pending: 'New booking request for',
                      confirmed: 'Confirmed booking for',
                      completed: 'Completed session:',
                      cancelled: 'Cancelled booking for',
                      declined: 'Declined booking for',
                    };
                    return (
                      <div key={apt.id} className="flex gap-4">
                        <div className={`w-2 h-2 rounded-full ${statusColors[apt.status] || 'bg-outline-variant'} mt-2 flex-shrink-0`} />
                        <div>
                          <p className="text-sm font-body text-on-surface">
                            {actionText[apt.status] || 'Updated:'}{' '}
                            <span className="font-bold text-primary">
                              {apt.service_name || `Service #${apt.service_id}`}
                            </span>
                            {apt.price_quoted && (
                              <span className="text-on-surface-variant"> · ${apt.price_quoted}</span>
                            )}
                          </p>
                          <span className="text-[10px] text-on-surface-variant font-label uppercase">
                            {formatDistanceToNow(new Date(apt.updated_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <button
                onClick={() => navigate('/dashboard/appointments')}
                className="w-full mt-8 py-2 text-sm font-bold text-primary hover:underline underline-offset-4 decoration-2 decoration-tertiary-fixed transition-all"
              >
                View All Appointments
              </button>
            </div>

            {/* Support CTA */}
            <div className="bg-tertiary p-8 rounded-xl text-on-tertiary relative overflow-hidden">
              <h3 className="text-xl font-bold font-headline mb-2">Need Help?</h3>
              <p className="text-sm font-body opacity-80 mb-6 leading-relaxed">
                Need help with your listings or appointment setup? Our support team is available.
              </p>
              <button className="bg-tertiary-fixed text-on-tertiary-fixed px-6 py-2 rounded-md font-bold text-sm hover:bg-tertiary-fixed-dim transition-colors">
                Contact Support
              </button>
              <div className="absolute -right-4 -bottom-4 opacity-10">
                <Icon name="support_agent" className="text-[100px]" />
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Create Storefront Modal */}
      <CreateStorefrontModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </DashboardLayout>
  );
}
