import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { parseISO } from 'date-fns';
import AppScaffold from '../components/layout/AppScaffold';
import ProfileHeader from '../components/booking/ProfileHeader';
import PortfolioCard from '../components/booking/PortfolioCard';
import DropCard from '../components/booking/DropCard';
import BookingModal from '../components/booking/BookingModal';
import UniversalCard from '../components/universal/UniversalCard';
import UniversalButton from '../components/universal/UniversalButton';
import { usePublicStorefront } from '../hooks/useMarketplace';
import { usePublicDrops } from '../hooks/useDrops';

export default function VendorProfilePage() {
  const { storefrontId } = useParams<{ storefrontId: string }>();
  const id = storefrontId ? parseInt(storefrontId, 10) : null;

  // Booking modal state
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [preSelectedServiceId, setPreSelectedServiceId] = useState<number | undefined>();
  const [preSelectedDropId, setPreSelectedDropId] = useState<number | undefined>();
  const [dropServiceId, setDropServiceId] = useState<number | null | undefined>();

  const {
    data: storefrontData,
    isLoading,
    isError,
    error,
  } = usePublicStorefront(id);

  const { data: publicDrops } = usePublicDrops(id);

  // Loading State
  if (isLoading) {
    return (
      <AppScaffold>
        <UniversalCard className="flex flex-col items-center justify-center py-12 max-w-md mx-auto">
          <Loader2 className="h-8 w-8 animate-spin text-v3-accent mb-3" />
          <span className="text-v3-secondary">Loading storefront...</span>
        </UniversalCard>
      </AppScaffold>
    );
  }

  // Error State
  if (isError) {
    return (
      <AppScaffold>
        <UniversalCard className="bg-red-50 border-red-200 p-6 max-w-md mx-auto">
          <h3 className="text-lg font-semibold text-red-900 mb-2">Error</h3>
          <p className="text-red-700">
            {error?.message || 'Failed to load storefront'}
          </p>
        </UniversalCard>
      </AppScaffold>
    );
  }

  // Not Found State
  if (!storefrontData) {
    return (
      <AppScaffold>
        <UniversalCard className="bg-yellow-50 border-yellow-200 p-6 max-w-md mx-auto">
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">
            Storefront Not Found
          </h3>
          <p className="text-yellow-700">
            The storefront you're looking for doesn't exist or has been removed.
          </p>
        </UniversalCard>
      </AppScaffold>
    );
  }

  const { storefront } = storefrontData;

  // Build location string
  const location = storefront.location_type === 'mobile'
    ? storefront.service_area_city || 'Service Area'
    : `${storefront.city || ''}${storefront.state ? ', ' + storefront.state : ''}`.trim() || storefront.address || 'Location not specified';

  // Success State - Render Profile
  return (
    <AppScaffold>
      <ProfileHeader
        name={storefront.name}
        description={storefront.description}
        avatarUrl={storefront.avatar_url || undefined}
        instagram={storefront.instagram_handle || undefined}
        location={location}
        verified={storefront.is_verified}
      />

      {/* Upcoming Drops Section */}
      {publicDrops && publicDrops.length > 0 && (
        <div className="max-w-4xl mx-auto mt-12 px-4">
          <h2 className="text-3xl font-bold text-v3-primary mb-6">Upcoming Drops</h2>
          <div className="space-y-4">
            {publicDrops.map(drop => {
              const dropDate = typeof drop.drop_date === 'string'
                ? parseISO(drop.drop_date.substring(0, 10))
                : new Date(drop.drop_date);

              return (
                <DropCard
                  key={drop.id}
                  title={drop.title}
                  date={dropDate}
                  totalSlots={drop.max_concurrent_appointments}
                  availableSlots={drop.max_concurrent_appointments}
                  onSelect={() => {
                    setPreSelectedDropId(drop.id);
                    setDropServiceId(drop.service_id);
                    // If drop has a specific service, pre-select it
                    if (drop.service_id) {
                      setPreSelectedServiceId(drop.service_id);
                    } else {
                      setPreSelectedServiceId(undefined);
                    }
                    setIsBookingModalOpen(true);
                  }}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Services Section */}
      {storefrontData.services.length > 0 && (
        <div className="max-w-4xl mx-auto mt-12 px-4">
          <h2 className="text-3xl font-bold text-v3-primary mb-6">Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {storefrontData.services.map(service => (
              <PortfolioCard
                key={service.id}
                title={service.name}
                price={service.price}
                duration={service.duration}
                imageUrl={service.image_url || undefined}
                onSelect={() => {
                  setPreSelectedServiceId(service.id);
                  setPreSelectedDropId(undefined);
                  setDropServiceId(undefined);
                  setIsBookingModalOpen(true);
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* General Booking CTA */}
      {storefrontData.services.length > 0 && (
        <div className="max-w-md mx-auto mt-8 px-4 text-center">
          <UniversalButton
            variant="primary"
            size="lg"
            onClick={() => {
              setPreSelectedServiceId(undefined);
              setPreSelectedDropId(undefined);
              setDropServiceId(undefined);
              setIsBookingModalOpen(true);
            }}
            className="w-full"
          >
            Book an Appointment
          </UniversalButton>
        </div>
      )}

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => {
          setIsBookingModalOpen(false);
          setPreSelectedServiceId(undefined);
          setPreSelectedDropId(undefined);
          setDropServiceId(undefined);
        }}
        storefront={storefront}
        services={storefrontData.services}
        preSelectedServiceId={preSelectedServiceId}
        preSelectedDropId={preSelectedDropId}
        dropServiceId={dropServiceId}
      />
    </AppScaffold>
  );
}
