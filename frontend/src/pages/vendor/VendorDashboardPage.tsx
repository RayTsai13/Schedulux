import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MapPin, Calendar, Clock } from 'lucide-react';
import { useStorefronts } from '../../hooks/useStorefronts';
import AppScaffold from '../../components/layout/AppScaffold';
import UniversalButton from '../../components/universal/UniversalButton';
import UniversalCard from '../../components/universal/UniversalCard';
import CreateStorefrontModal from '../../components/vendor/CreateStorefrontModal';

export default function VendorDashboardPage() {
  const navigate = useNavigate();
  const { data: storefronts, isLoading, error } = useStorefronts();
  const [showCreateModal, setShowCreateModal] = useState(false);

  if (isLoading) {
    return (
      <AppScaffold>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-v3-accent border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
            <p className="mt-4 text-v3-secondary">Loading storefronts...</p>
          </div>
        </div>
      </AppScaffold>
    );
  }

  if (error) {
    return (
      <AppScaffold>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <p className="text-red-500 mb-4">Failed to load storefronts</p>
            <UniversalButton variant="primary" onClick={() => window.location.reload()}>
              Retry
            </UniversalButton>
          </div>
        </div>
      </AppScaffold>
    );
  }

  return (
    <AppScaffold>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-v3-primary mb-2">
              My Storefronts
            </h1>
            <p className="text-v3-secondary">
              Manage your business locations and services
            </p>
          </div>
          <UniversalButton
            variant="primary"
            size="lg"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Storefront
          </UniversalButton>
        </div>

        {/* Storefronts Grid */}
        {!storefronts || storefronts.length === 0 ? (
          // Empty State
          <UniversalCard className="p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-v3-accent/10 flex items-center justify-center">
                <Calendar className="w-8 h-8 text-v3-accent" />
              </div>
              <h3 className="text-2xl font-semibold text-v3-primary mb-2">
                No storefronts yet
              </h3>
              <p className="text-v3-secondary mb-6">
                Create your first storefront to start accepting bookings
              </p>
              <UniversalButton
                variant="primary"
                size="lg"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Storefront
              </UniversalButton>
            </div>
          </UniversalCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {storefronts.map((storefront) => (
              <UniversalCard
                key={storefront.id}
                className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/dashboard/storefront/${storefront.id}`)}
              >
                {/* Header */}
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-v3-primary mb-2">
                    {storefront.name}
                  </h3>
                  {storefront.description && (
                    <p className="text-v3-secondary line-clamp-2 text-sm">
                      {storefront.description}
                    </p>
                  )}
                </div>

                {/* Location */}
                {(storefront.city || storefront.address) && (
                  <div className="flex items-start gap-2 mb-3">
                    <MapPin className="w-4 h-4 text-v3-secondary mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-v3-secondary">
                      {storefront.location_type === 'mobile' || storefront.location_type === 'hybrid'
                        ? `${storefront.service_area_city || storefront.city}, ${storefront.state}`
                        : storefront.address || `${storefront.city}, ${storefront.state}`
                      }
                    </p>
                  </div>
                )}

                {/* Profile & Location Type Badges */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-v3-accent/10 text-v3-accent rounded-full">
                    {storefront.profile_type === 'individual' ? 'Individual' : 'Business'}
                  </span>
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-v3-primary/10 text-v3-primary rounded-full">
                    {storefront.location_type === 'fixed' ? 'Fixed Location' :
                     storefront.location_type === 'mobile' ? 'Mobile Service' :
                     'Hybrid'}
                  </span>
                  {storefront.is_verified && (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-500/10 text-green-600 rounded-full">
                      ✓ Verified
                    </span>
                  )}
                </div>

                {/* Quick Stats - Placeholder for now */}
                <div className="pt-4 border-t border-v3-border flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-v3-secondary">
                    <Clock className="w-4 h-4" />
                    <span>Active</span>
                  </div>
                  <UniversalButton
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/dashboard/storefront/${storefront.id}`);
                    }}
                  >
                    Manage →
                  </UniversalButton>
                </div>
              </UniversalCard>
            ))}
          </div>
        )}
      </div>

      {/* Create Storefront Modal */}
      <CreateStorefrontModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </AppScaffold>
  );
}
