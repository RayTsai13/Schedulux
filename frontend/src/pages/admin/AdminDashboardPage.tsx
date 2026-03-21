import { useState } from 'react';
import { toast } from 'sonner';
import AppScaffold from '../../components/layout/AppScaffold';
import { useAdminStats, useAdminStorefronts, useVerifyStorefront } from '../../hooks/useAdmin';

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6">
      <p className="text-sm text-on-surface-variant mb-1">{label}</p>
      <p className="text-3xl font-bold text-on-surface">{value}</p>
    </div>
  );
}

const PAGE_SIZE = 20;

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

  return (
    <AppScaffold>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-on-surface">Admin Dashboard</h1>
          <p className="text-on-surface-variant mt-1">Platform overview and storefront management</p>
        </div>

        {/* Stats Cards */}
        {statsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 animate-pulse">
                <div className="h-4 bg-outline-variant rounded w-2/3 mb-2" />
                <div className="h-8 bg-outline-variant rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Users" value={stats.users.total} />
            <StatCard label="Vendors" value={stats.users.byRole['vendor'] ?? 0} />
            <StatCard label="Storefronts" value={stats.storefronts.total} />
            <StatCard label="Appointments" value={stats.appointments.total} />
          </div>
        ) : null}

        {/* Storefront Table */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-outline-variant">
            <h2 className="text-lg font-semibold text-on-surface">Storefronts</h2>
            {storefrontData && (
              <p className="text-sm text-on-surface-variant mt-0.5">{storefrontData.total} total</p>
            )}
          </div>

          {sfLoading ? (
            <div className="p-6 text-center text-on-surface-variant">Loading storefronts...</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-outline-variant bg-surface">
                      <th className="text-left px-6 py-3 text-on-surface-variant font-medium">Name</th>
                      <th className="text-left px-6 py-3 text-on-surface-variant font-medium">Vendor</th>
                      <th className="text-left px-6 py-3 text-on-surface-variant font-medium">Location</th>
                      <th className="text-left px-6 py-3 text-on-surface-variant font-medium">Type</th>
                      <th className="text-left px-6 py-3 text-on-surface-variant font-medium">Verified</th>
                      <th className="text-left px-6 py-3 text-on-surface-variant font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {storefrontData?.storefronts.map((sf) => (
                      <tr key={sf.id} className="border-b border-outline-variant last:border-0 hover:bg-surface/50">
                        <td className="px-6 py-4 font-medium text-on-surface">{sf.name}</td>
                        <td className="px-6 py-4 text-on-surface-variant">
                          <div>{sf.first_name} {sf.last_name}</div>
                          <div className="text-xs text-on-surface-variant/70">{sf.vendor_email}</div>
                        </td>
                        <td className="px-6 py-4 text-on-surface-variant">
                          {[sf.city, sf.state].filter(Boolean).join(', ') || '—'}
                        </td>
                        <td className="px-6 py-4 text-on-surface-variant capitalize">{sf.location_type}</td>
                        <td className="px-6 py-4">
                          {sf.is_verified ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-outline-variant text-on-surface-variant">
                              Unverified
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleToggleVerify(sf.id, sf.is_verified)}
                            disabled={verifyMutation.isPending}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              sf.is_verified
                                ? 'bg-outline-variant text-on-surface-variant hover:bg-red-100 hover:text-red-700'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            } disabled:opacity-50`}
                          >
                            {sf.is_verified ? 'Unverify' : 'Verify'}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {storefrontData?.storefronts.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-on-surface-variant">
                          No storefronts found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-outline-variant flex items-center justify-between">
                  <p className="text-sm text-on-surface-variant">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                      disabled={offset === 0}
                      className="px-3 py-1.5 rounded-lg text-sm border border-outline-variant text-on-surface-variant hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setOffset(offset + PAGE_SIZE)}
                      disabled={offset + PAGE_SIZE >= (storefrontData?.total ?? 0)}
                      className="px-3 py-1.5 rounded-lg text-sm border border-outline-variant text-on-surface-variant hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AppScaffold>
  );
}
