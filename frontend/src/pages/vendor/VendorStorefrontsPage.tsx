import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStorefronts } from '../../hooks/useStorefronts';
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
// VendorStorefrontsPage
// ---------------------------------------------------------------------------
export default function VendorStorefrontsPage() {
  const navigate = useNavigate();
  const { data: storefronts, isLoading } = useStorefronts();
  const [showCreateModal, setShowCreateModal] = useState(false);

  if (isLoading) {
    return (
      <DashboardLayout title="Storefronts">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  const storefrontCount = storefronts?.length ?? 0;

  return (
    <DashboardLayout title="Storefronts">
      <div className="space-y-12">

        {/* ============================================================
         * EDITORIAL HEADER
         * ============================================================ */}
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="max-w-2xl">
            <span className="text-tertiary font-label font-semibold tracking-wider text-xs uppercase mb-4 block">
              Business Management
            </span>
            <h2 className="text-4xl font-headline font-extrabold text-primary leading-tight tracking-tighter">
              Your Storefronts
            </h2>
            <p className="mt-3 text-on-surface-variant text-lg font-body max-w-lg leading-relaxed">
              Manage your locations, services, and availability. Each storefront is a self-contained business hub.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-primary text-on-primary px-6 py-3 rounded-md font-bold text-sm flex items-center gap-2 hover:bg-primary-container transition-all active:scale-[0.98] shrink-0"
          >
            <Icon name="add" className="text-lg" />
            New Storefront
          </button>
        </header>

        {/* ============================================================
         * STOREFRONTS GRID
         * ============================================================ */}
        {storefrontCount === 0 ? (
          <div
            className="bg-surface-container-lowest rounded-xl p-16 text-center"
            style={{ boxShadow: '0 20px 40px rgba(27,28,26,0.05)' }}
          >
            <Icon name="storefront" className="text-7xl text-outline mb-6" />
            <h3 className="text-2xl font-bold text-primary mb-3 font-headline">
              No storefronts yet
            </h3>
            <p className="text-on-surface-variant mb-8 max-w-md mx-auto leading-relaxed">
              Create your first storefront to start accepting bookings and managing your services.
              Each storefront can have its own services, schedule rules, and calendar.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-primary text-on-primary font-headline font-bold py-3 px-8 rounded-lg hover:bg-primary-container transition-all flex items-center justify-center gap-2 mx-auto active:scale-[0.98]"
            >
              <Icon name="add" className="text-lg" />
              Create Your First Storefront
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {storefronts!.map((sf) => (
              <article
                key={sf.id}
                onClick={() => navigate(`/dashboard/storefront/${sf.id}`)}
                className="bg-surface-container-lowest rounded-xl p-8 cursor-pointer hover:bg-surface-container-low transition-all group relative overflow-hidden"
                style={{ borderBottom: '2px solid rgba(191,201,195,0.15)', boxShadow: '0 20px 40px rgba(27,28,26,0.03)' }}
              >
                {/* Status dot */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-secondary-container flex items-center justify-center">
                      <Icon name="storefront" fill className="text-on-secondary-container" />
                    </div>
                    <div>
                      <h3 className="font-bold text-primary text-lg group-hover:text-tertiary transition-colors font-headline leading-tight">
                        {sf.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`w-2 h-2 rounded-full ${sf.is_active ? 'bg-secondary' : 'bg-outline-variant'}`} />
                        <span className="text-xs text-on-surface-variant font-label">
                          {sf.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-secondary-container text-on-secondary-container text-[10px] font-bold rounded uppercase tracking-wider">
                    {sf.location_type}
                  </span>
                </div>

                {sf.description && (
                  <p className="text-sm text-on-surface-variant line-clamp-2 mb-4 leading-relaxed">
                    {sf.description}
                  </p>
                )}

                {/* Meta row */}
                <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid rgba(191,201,195,0.15)' }}>
                  <span className="text-xs text-on-surface-variant flex items-center gap-1">
                    <Icon name="location_on" fill className="text-xs" />
                    {sf.city || 'Location not set'}{sf.state ? `, ${sf.state}` : ''}
                  </span>
                  <span className="text-primary text-sm font-bold flex items-center gap-1">
                    Manage
                    <Icon name="arrow_forward" className="text-sm group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>

                {/* Quick action buttons */}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/storefront/${sf.id}/calendar`); }}
                    className="flex-1 bg-surface-container-low text-on-surface-variant py-2 rounded-md text-xs font-bold flex items-center justify-center gap-1 hover:text-primary hover:bg-surface-container transition-all"
                  >
                    <Icon name="calendar_today" className="text-sm" />
                    Calendar
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/book/${sf.id}`); }}
                    className="flex-1 bg-surface-container-low text-on-surface-variant py-2 rounded-md text-xs font-bold flex items-center justify-center gap-1 hover:text-primary hover:bg-surface-container transition-all"
                  >
                    <Icon name="visibility" className="text-sm" />
                    Public View
                  </button>
                </div>
              </article>
            ))}

            {/* Add card */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-surface-container-low rounded-xl p-8 flex flex-col items-center justify-center gap-4 border-2 border-dashed border-outline-variant/30 hover:border-primary hover:bg-surface-container-lowest transition-all min-h-[260px] group"
            >
              <div className="w-14 h-14 rounded-full bg-secondary-container flex items-center justify-center group-hover:bg-primary transition-colors">
                <Icon name="add" className="text-2xl text-on-secondary-container group-hover:text-on-primary transition-colors" />
              </div>
              <span className="font-headline font-bold text-on-surface-variant group-hover:text-primary transition-colors">
                Add Storefront
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Create Storefront Modal */}
      <CreateStorefrontModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </DashboardLayout>
  );
}
