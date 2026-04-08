import { useState } from 'react';
import { toast } from 'sonner';
import AppScaffold from '../../components/layout/AppScaffold';
import { useAdminStats, useAdminStorefronts, useVerifyStorefront } from '../../hooks/useAdmin';

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
// Stat config
// ---------------------------------------------------------------------------
const STAT_CFG = [
  { key: 'users', icon: 'group', label: 'Total Users', bg: 'bg-secondary-fixed', fg: 'text-on-secondary-fixed' },
  { key: 'vendors', icon: 'storefront', label: 'Vendors', bg: 'bg-tertiary-fixed', fg: 'text-on-tertiary-fixed' },
  { key: 'storefronts', icon: 'store', label: 'Storefronts', bg: 'bg-primary-fixed', fg: 'text-on-primary-fixed' },
  { key: 'appointments', icon: 'calendar_month', label: 'Appointments', bg: 'bg-surface-container-low', fg: 'text-primary' },
] as const;

const PAGE_SIZE = 20;

// ---------------------------------------------------------------------------
// AdminDashboardPage
// ---------------------------------------------------------------------------
export default function AdminDashboardPage() {
  const [offset, setOffset] = useState(0);

  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: storefrontData, isLoading: sfLoading } = useAdminStorefronts(PAGE_SIZE, offset);
  const verifyMutation = useVerifyStorefront();

  const handleToggleVerify = (id: number, currentlyVerified: boolean) => {
    const next = !currentlyVerified;
    verifyMutation.mutate(
      { id, is_verified: next },
      {
        onSuccess: (res) => {
          if (res.success) {
            toast.success(next ? 'Storefront verified' : 'Storefront unverified');
          } else {
            toast.error(res.message || 'Failed to update');
          }
        },
        onError: () => toast.error('Failed to update verification'),
      }
    );
  };

  const totalPages = storefrontData ? Math.ceil(storefrontData.total / PAGE_SIZE) : 0;
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  const statValues = stats
    ? [
        stats.users.total,
        stats.users.byRole['vendor'] ?? 0,
        stats.storefronts.total,
        stats.appointments.total,
      ]
    : [0, 0, 0, 0];

  return (
    <AppScaffold>
      <div className="max-w-6xl mx-auto space-y-12 pt-8 pb-24">

        {/* ============================================================
         * EDITORIAL HEADER
         * ============================================================ */}
        <header>
          <span className="text-tertiary font-label font-semibold tracking-wider text-xs uppercase mb-4 block">
            Platform Management
          </span>
          <h1 className="text-5xl font-headline font-extrabold text-primary leading-tight tracking-tighter">
            Admin Dashboard
          </h1>
          <p className="mt-4 text-on-surface-variant text-lg font-body max-w-lg leading-relaxed">
            Platform overview and storefront management. Monitor growth, verify businesses, and maintain ecosystem integrity.
          </p>
        </header>

        {/* ============================================================
         * STAT CARDS
         * ============================================================ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STAT_CFG.map((cfg, i) => (
            <div
              key={cfg.key}
              className="bg-surface-container-lowest rounded-xl p-6"
              style={{ boxShadow: '0 20px 40px rgba(27,28,26,0.05)' }}
            >
              <div className={`w-10 h-10 rounded-full ${cfg.bg} flex items-center justify-center mb-4`}>
                <Icon name={cfg.icon} className={`text-sm ${cfg.fg}`} />
              </div>
              <p className="text-xs text-on-surface-variant font-medium uppercase tracking-widest">{cfg.label}</p>
              {statsLoading ? (
                <div className="h-8 bg-surface-container-low rounded w-1/2 mt-1 animate-pulse" />
              ) : (
                <p className="text-3xl font-bold text-primary mt-1">{statValues[i]}</p>
              )}
            </div>
          ))}
        </div>

        {/* ============================================================
         * STOREFRONT TABLE
         * ============================================================ */}
        <section>
          <div className="flex items-center gap-4 mb-6">
            <span className="text-xs font-bold tracking-widest uppercase text-on-surface-variant">Storefronts</span>
            <span className="h-px flex-1 bg-outline-variant/15" />
            {storefrontData && (
              <span className="text-sm text-on-surface-variant font-medium">{storefrontData.total} total</span>
            )}
          </div>

          <div
            className="bg-surface-container-lowest rounded-xl overflow-hidden border border-outline-variant/15"
            style={{ boxShadow: '0 20px 40px rgba(27,28,26,0.03)' }}
          >
            {sfLoading ? (
              <div className="p-12 text-center">
                <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-outline-variant/10 bg-surface-container-low/50">
                        <th className="text-left px-6 py-4 text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">Name</th>
                        <th className="text-left px-6 py-4 text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">Vendor</th>
                        <th className="text-left px-6 py-4 text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">Location</th>
                        <th className="text-left px-6 py-4 text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">Type</th>
                        <th className="text-left px-6 py-4 text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">Status</th>
                        <th className="text-left px-6 py-4 text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {storefrontData?.storefronts.map((sf) => (
                        <tr key={sf.id} className="border-b border-outline-variant/5 last:border-0 hover:bg-surface-container-low/30 transition-colors">
                          <td className="px-6 py-4 font-bold text-primary font-headline">{sf.name}</td>
                          <td className="px-6 py-4">
                            <p className="font-medium text-on-surface">{sf.first_name} {sf.last_name}</p>
                            <p className="text-xs text-on-surface-variant">{sf.vendor_email}</p>
                          </td>
                          <td className="px-6 py-4 text-on-surface-variant">
                            {[sf.city, sf.state].filter(Boolean).join(', ') || '—'}
                          </td>
                          <td className="px-6 py-4">
                            <span className="capitalize text-on-surface-variant">{sf.location_type}</span>
                          </td>
                          <td className="px-6 py-4">
                            {sf.is_verified ? (
                              <span className="inline-flex items-center gap-1 bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                                <Icon name="verified" fill className="text-xs" />
                                Verified
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-surface-container-high text-on-surface-variant px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                                Unverified
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleToggleVerify(sf.id, sf.is_verified)}
                              disabled={verifyMutation.isPending}
                              className={`px-4 py-2 rounded-md text-xs font-bold transition-all disabled:opacity-50 ${
                                sf.is_verified
                                  ? 'bg-surface-container-high text-on-surface-variant hover:bg-error-container hover:text-on-error-container'
                                  : 'bg-primary text-on-primary hover:bg-primary-container'
                              }`}
                            >
                              {sf.is_verified ? 'Unverify' : 'Verify'}
                            </button>
                          </td>
                        </tr>
                      ))}
                      {storefrontData?.storefronts.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-on-surface-variant">
                            <Icon name="store" className="text-4xl text-outline mb-2 block mx-auto" />
                            No storefronts found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-outline-variant/10 flex items-center justify-between">
                    <p className="text-sm text-on-surface-variant">
                      Page {currentPage} of {totalPages}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                        disabled={offset === 0}
                        className="px-4 py-2 rounded-md text-sm font-medium border border-outline-variant text-on-surface-variant hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                      >
                        <Icon name="chevron_left" className="text-sm" />
                        Previous
                      </button>
                      <button
                        onClick={() => setOffset(offset + PAGE_SIZE)}
                        disabled={offset + PAGE_SIZE >= (storefrontData?.total ?? 0)}
                        className="px-4 py-2 rounded-md text-sm font-medium border border-outline-variant text-on-surface-variant hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                      >
                        Next
                        <Icon name="chevron_right" className="text-sm" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </div>
    </AppScaffold>
  );
}
