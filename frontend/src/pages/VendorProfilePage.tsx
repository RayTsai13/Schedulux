import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { parseISO, format } from 'date-fns';
import AppScaffold from '../components/layout/AppScaffold';
import BookingModal from '../components/booking/BookingModal';
import { usePublicStorefront } from '../hooks/useMarketplace';
import { usePublicDrops } from '../hooks/useDrops';

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

export default function VendorProfilePage() {
  const { storefrontId } = useParams<{ storefrontId: string }>();
  const navigate = useNavigate();
  const id = storefrontId ? parseInt(storefrontId, 10) : null;

  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [preSelectedServiceId, setPreSelectedServiceId] = useState<number | undefined>();
  const [preSelectedDropId, setPreSelectedDropId] = useState<number | undefined>();
  const [dropServiceId, setDropServiceId] = useState<number | null | undefined>();

  const { data: storefrontData, isLoading, isError, error } = usePublicStorefront(id);
  const { data: publicDrops } = usePublicDrops(id);

  // Restore pending booking from sessionStorage (after login redirect)
  useEffect(() => {
    if (!storefrontData || isLoading) return;
    const pending = sessionStorage.getItem('pendingBooking');
    if (!pending) return;
    try {
      const booking = JSON.parse(pending);
      if (booking.storefrontId !== id) return;
      if (booking.serviceId) setPreSelectedServiceId(booking.serviceId);
      if (booking.dropId) {
        setPreSelectedDropId(booking.dropId);
        const drop = publicDrops?.find((d) => d.id === booking.dropId);
        if (drop) setDropServiceId(drop.service_id);
      }
      setIsBookingModalOpen(true);
      sessionStorage.removeItem('pendingBooking');
    } catch {
      sessionStorage.removeItem('pendingBooking');
    }
  }, [storefrontData, isLoading, id, publicDrops]);

  // Loading
  if (isLoading) {
    return (
      <AppScaffold>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AppScaffold>
    );
  }

  // Error
  if (isError) {
    return (
      <AppScaffold>
        <div className="max-w-lg mx-auto pt-32 text-center">
          <Icon name="error" className="text-6xl text-error mb-4" />
          <h1 className="text-3xl font-headline font-bold text-primary mb-2">Something went wrong</h1>
          <p className="text-on-surface-variant mb-6">{error?.message || 'Failed to load storefront'}</p>
          <button onClick={() => navigate('/explore')} className="bg-primary text-on-primary px-6 py-3 rounded-md font-bold hover:bg-primary-container transition-all">
            Browse Marketplace
          </button>
        </div>
      </AppScaffold>
    );
  }

  // Not Found
  if (!storefrontData) {
    return (
      <AppScaffold>
        <div className="max-w-lg mx-auto pt-32 text-center">
          <Icon name="storefront" className="text-6xl text-outline mb-4" />
          <h1 className="text-3xl font-headline font-bold text-primary mb-2">Storefront Not Found</h1>
          <p className="text-on-surface-variant mb-6">This storefront doesn't exist or has been removed.</p>
          <button onClick={() => navigate('/explore')} className="bg-primary text-on-primary px-6 py-3 rounded-md font-bold hover:bg-primary-container transition-all">
            Browse Marketplace
          </button>
        </div>
      </AppScaffold>
    );
  }

  const { storefront } = storefrontData;

  const location =
    storefront.location_type === 'mobile'
      ? storefront.service_area_city || 'Service Area'
      : `${storefront.city || ''}${storefront.state ? ', ' + storefront.state : ''}`.trim() ||
        storefront.address ||
        'Location not specified';

  const openBooking = (serviceId?: number, dropId?: number, dServiceId?: number | null) => {
    setPreSelectedServiceId(serviceId);
    setPreSelectedDropId(dropId);
    setDropServiceId(dServiceId);
    setIsBookingModalOpen(true);
  };

  return (
    <AppScaffold>
      {/* ============================================================
       * EDITORIAL HERO
       * ============================================================ */}
      <section className="relative bg-surface-container-low overflow-hidden">
        <div className="max-w-6xl mx-auto px-8 pt-24 pb-16">
          {/* Breadcrumb */}
          <Link
            to="/explore"
            className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors text-sm font-label mb-8"
          >
            <Icon name="arrow_back" className="text-sm" />
            Back to Marketplace
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-end">
            {/* Left: Info */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                  {storefront.location_type === 'mobile' ? 'Mobile' : 'Fixed Location'}
                </span>
                {storefront.is_verified && (
                  <span className="bg-primary-fixed text-on-primary-fixed px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-1">
                    <Icon name="verified" fill className="text-xs" />
                    Verified
                  </span>
                )}
              </div>

              <h1 className="text-5xl md:text-6xl font-headline font-extrabold text-primary leading-tight tracking-tighter">
                {storefront.name}
              </h1>

              {storefront.description && (
                <p className="text-on-surface-variant text-lg leading-relaxed max-w-lg">
                  {storefront.description}
                </p>
              )}

              <div className="flex items-center gap-6 text-on-surface-variant">
                <div className="flex items-center gap-2">
                  <Icon name="location_on" className="text-tertiary" />
                  <span className="text-sm font-medium">{location}</span>
                </div>
                {storefront.instagram_handle && (
                  <a
                    href={`https://instagram.com/${storefront.instagram_handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm font-medium hover:text-primary transition-colors"
                  >
                    @{storefront.instagram_handle}
                  </a>
                )}
              </div>

              <button
                onClick={() => openBooking()}
                className="bg-primary text-on-primary px-8 py-4 rounded-md font-headline font-bold hover:bg-primary-container transition-all flex items-center gap-2 group"
              >
                Book an Appointment
                <Icon name="arrow_forward" className="transition-transform group-hover:translate-x-1" />
              </button>
            </div>

            {/* Right: Avatar/Image Card */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <div className="w-64 h-80 bg-secondary-container/30 rounded-2xl flex items-center justify-center overflow-hidden">
                {storefront.avatar_url ? (
                  <img src={storefront.avatar_url} alt={storefront.name} className="w-full h-full object-cover" />
                ) : (
                  <Icon name="storefront" className="text-8xl text-outline-variant" />
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
       * STATS BAR
       * ============================================================ */}
      <section className="max-w-6xl mx-auto px-8 -mt-6 mb-12 relative z-10">
        <div
          className="bg-surface-container-lowest rounded-xl p-6 flex flex-wrap gap-8 items-center"
          style={{ boxShadow: '0 20px 40px rgba(27,28,26,0.05)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center">
              <Icon name="design_services" className="text-sm text-on-secondary-fixed" />
            </div>
            <div>
              <p className="text-xs text-on-surface-variant font-medium">Services</p>
              <p className="text-xl font-bold text-primary">{storefrontData.services.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-tertiary-fixed flex items-center justify-center">
              <Icon name="local_fire_department" className="text-sm text-on-tertiary-fixed" />
            </div>
            <div>
              <p className="text-xs text-on-surface-variant font-medium">Active Drops</p>
              <p className="text-xl font-bold text-primary">{publicDrops?.length ?? 0}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
       * UPCOMING DROPS
       * ============================================================ */}
      {publicDrops && publicDrops.length > 0 && (
        <section className="max-w-6xl mx-auto px-8 mb-16">
          <div className="flex items-center gap-4 mb-8">
            <span className="text-xs font-bold tracking-widest uppercase text-tertiary">Upcoming Drops</span>
            <span className="h-px flex-1 bg-outline-variant/15" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {publicDrops.map((drop) => {
              const dropDate =
                typeof drop.drop_date === 'string' ? parseISO(drop.drop_date.substring(0, 10)) : new Date(drop.drop_date);
              return (
                <button
                  key={drop.id}
                  onClick={() => openBooking(drop.service_id || undefined, drop.id, drop.service_id)}
                  className="bg-tertiary-fixed text-on-tertiary-fixed p-6 rounded-xl text-left group hover:scale-[1.02] transition-all"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Icon name="event_available" className="text-sm" />
                    <span className="text-xs font-bold tracking-widest uppercase">Drop</span>
                  </div>
                  <h3 className="text-xl font-headline font-bold mb-2">{drop.title}</h3>
                  <p className="text-sm opacity-80 mb-4">{format(dropDate, 'EEEE, MMMM d, yyyy')}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">
                      {drop.max_concurrent_appointments} slots available
                    </span>
                    <Icon name="arrow_forward" className="text-sm group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* ============================================================
       * SERVICES
       * ============================================================ */}
      {storefrontData.services.length > 0 && (
        <section className="max-w-6xl mx-auto px-8 mb-16">
          <div className="flex items-center gap-4 mb-8">
            <span className="text-xs font-bold tracking-widest uppercase text-on-surface-variant">Services Offered</span>
            <span className="h-px flex-1 bg-outline-variant/15" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {storefrontData.services.map((service) => (
              <article
                key={service.id}
                className="bg-surface-container-lowest rounded-xl p-8 group cursor-pointer hover:scale-[1.01] transition-all"
                style={{ boxShadow: '0 20px 40px rgba(27,28,26,0.05)' }}
                onClick={() => openBooking(service.id)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-headline font-bold text-primary mb-1">{service.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-on-surface-variant">
                      <span className="flex items-center gap-1">
                        <Icon name="schedule" className="text-sm text-tertiary" />
                        {service.duration} min
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon name="payments" className="text-sm text-tertiary" />
                        ${service.price}
                      </span>
                    </div>
                  </div>
                  <Icon name="arrow_forward" className="text-primary group-hover:translate-x-1 transition-transform" />
                </div>
                {service.description && (
                  <p className="text-sm text-on-surface-variant leading-relaxed">{service.description}</p>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ============================================================
       * BOOKING CTA
       * ============================================================ */}
      <section className="max-w-5xl mx-auto px-8 mb-24">
        <div className="bg-primary rounded-xl p-10 lg:p-16 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-container via-tertiary to-secondary" />
          <div className="relative z-10">
            <Icon name="calendar_month" className="text-5xl text-on-primary-container mb-4" />
            <h2 className="text-3xl lg:text-4xl font-headline font-extrabold text-on-primary mb-4">
              Ready to get started?
            </h2>
            <p className="text-on-primary-container text-lg mb-8 max-w-md mx-auto opacity-90">
              Book a session with {storefront.name} and experience quality service rooted in the PNW community.
            </p>
            <button
              onClick={() => openBooking()}
              className="bg-surface-container-lowest text-primary px-10 py-4 rounded-md font-headline font-bold hover:bg-white transition-all"
            >
              Book Now
            </button>
          </div>
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary-container rounded-full blur-3xl opacity-30" />
        </div>
      </section>

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
