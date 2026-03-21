import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStorefronts } from '../../hooks/useStorefronts';
import { useAuth } from '../../hooks/useAuth';
import DashboardLayout from '../../components/layout/DashboardLayout';
import CreateStorefrontModal from '../../components/vendor/CreateStorefrontModal';

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
// Mock data for the editorial dashboard
// ---------------------------------------------------------------------------
const MOCK_EVENTS = [
  {
    month: 'JUN',
    day: '14',
    title: 'Summer Market',
    detail: 'Featured Table: 24B',
    meta: 'Civic Center Plaza',
    metaIcon: 'location_on',
  },
  {
    month: 'JUN',
    day: '21',
    title: 'Community Workshop',
    detail: '12 Registered • 3 Spots Left',
    meta: '6:00 PM - 8:30 PM',
    metaIcon: 'schedule',
  },
];

const MOCK_ACTIVITY = [
  { text: 'New booking from', highlight: 'Marlowe K.', time: '2 minutes ago', color: 'bg-secondary' },
  { text: 'Service updated:', highlight: 'Standard Session', time: '1 hour ago', color: 'bg-outline-variant' },
  { text: 'Payout of', highlight: '$1,240.00', time: 'Yesterday', color: 'bg-secondary', highlightColor: 'text-primary' },
];

const CHART_BARS = [
  { height: '40%', opacity: 'bg-secondary-container/30' },
  { height: '60%', opacity: 'bg-secondary-container/40' },
  { height: '50%', opacity: 'bg-secondary-container/30' },
  { height: '85%', opacity: 'bg-primary' },
  { height: '70%', opacity: 'bg-secondary-container/40' },
  { height: '45%', opacity: 'bg-secondary-container/30' },
  { height: '95%', opacity: 'bg-secondary-container/40' },
];

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

// ---------------------------------------------------------------------------
// VendorDashboardPage
// ---------------------------------------------------------------------------
export default function VendorDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: storefronts, isLoading } = useStorefronts();
  const [showCreateModal, setShowCreateModal] = useState(false);

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
  const firstName = user?.first_name || 'there';

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-12">

        {/* ============================================================
         * METRIC BENTO GRID
         * ============================================================ */}
        <section className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {/* Total Impact Value — Hero card */}
          <div className="col-span-1 md:col-span-2 bg-primary p-8 rounded-xl flex flex-col justify-between text-on-primary min-h-[200px] relative overflow-hidden group">
            <div className="relative z-10">
              <span className="text-on-primary-container text-xs font-label tracking-widest uppercase">
                Total Bookings Value
              </span>
              <h2 className="text-5xl font-bold font-headline mt-2 tracking-tight">$4,280</h2>
              <div className="flex items-center gap-2 mt-4 text-on-primary-container text-sm">
                <Icon name="trending_up" className="text-sm" />
                <span>12% increase from last month</span>
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

          {/* Local Reach */}
          <div className="bg-surface-container-low p-8 rounded-xl flex flex-col justify-between min-h-[200px]">
            <div>
              <span className="text-on-surface-variant text-xs font-label tracking-widest uppercase">
                Appointments
              </span>
              <h2 className="text-4xl font-bold font-headline mt-2 text-primary">28</h2>
            </div>
            <p className="text-on-surface-variant text-xs font-body leading-relaxed">
              Total sessions scheduled this month across all storefronts.
            </p>
          </div>
        </section>

        {/* ============================================================
         * MAIN 12-COLUMN SECTION
         * ============================================================ */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* ---- Left 8-col: Chart + Events ---- */}
          <div className="lg:col-span-8 space-y-12">

            {/* Revenue Trend Chart */}
            <div>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold font-headline text-primary">Revenue Trend</h3>
                <div className="flex gap-2">
                  <span className="px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold uppercase tracking-wider">
                    Weekly
                  </span>
                  <span className="px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant text-[10px] font-bold uppercase tracking-wider">
                    Monthly
                  </span>
                </div>
              </div>
              <div className="aspect-[16/7] bg-surface-container-lowest rounded-xl p-8 relative overflow-hidden">
                {/* Bar chart */}
                <div className="absolute inset-x-8 bottom-8 top-16 flex items-end justify-between gap-4">
                  {CHART_BARS.map((bar, i) => (
                    <div
                      key={i}
                      className={`w-full ${bar.opacity} rounded-t-sm transition-all hover:opacity-80`}
                      style={{ height: bar.height }}
                    />
                  ))}
                </div>
                {/* Labels */}
                <div className="flex justify-between text-[10px] font-label text-on-surface-variant mt-2 absolute bottom-2 inset-x-8">
                  {DAYS.map((d) => (
                    <span key={d}>{d}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Upcoming Events */}
            <div>
              <h3 className="text-2xl font-bold font-headline text-primary mb-8">
                Upcoming Appointments
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {MOCK_EVENTS.map((event, i) => (
                  <div
                    key={i}
                    className="flex gap-6 p-6 bg-surface-container-low rounded-xl group hover:bg-surface-container-lowest transition-colors cursor-pointer"
                  >
                    <div className="shrink-0 text-center">
                      <span className="block text-tertiary font-bold text-lg font-headline">
                        {event.month}
                      </span>
                      <span className="block text-3xl font-extrabold text-primary font-headline">
                        {event.day}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-on-surface text-lg leading-tight">
                        {event.title}
                      </h4>
                      <p className="text-sm text-on-surface-variant">{event.detail}</p>
                      <div className="flex items-center gap-2 text-xs text-primary font-bold pt-2">
                        <Icon name={event.metaIcon} className="text-sm" />
                        <span>{event.meta}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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

            {/* Recent Activity */}
            <div className="bg-surface-container-lowest p-8 rounded-xl" style={{ borderBottom: '2px solid rgba(191,201,195,0.15)' }}>
              <h3 className="text-xl font-bold font-headline text-primary mb-6">Recent Activity</h3>
              <div className="space-y-6">
                {MOCK_ACTIVITY.map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className={`w-2 h-2 rounded-full ${item.color} mt-2 flex-shrink-0`} />
                    <div>
                      <p className="text-sm font-body text-on-surface">
                        {item.text}{' '}
                        <span className={`font-bold ${item.highlightColor || 'text-primary'}`}>
                          {item.highlight}
                        </span>
                      </p>
                      <span className="text-[10px] text-on-surface-variant font-label uppercase">
                        {item.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-8 py-2 text-sm font-bold text-primary hover:underline underline-offset-4 decoration-2 decoration-tertiary-fixed transition-all">
                View All History
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
