import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useHandle } from '../../hooks/useHandle';
import PublicPageShell, { PageMessage, PageSpinner } from '../../components/public/PublicPageShell';
import SpotsMeter from '../../components/public/SpotsMeter';
import BookingModal from '../../components/booking/BookingModal';
import { usePublicPage } from '../../hooks/usePage';
import { formatCalendarDate, formatClock } from '../../lib/booking';
import NotFoundPage from '../NotFoundPage';

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

/**
 * A vendor's public booking page: /@slug
 */
export default function PublicPage() {
  const slug = useHandle();
  const { data: page, isLoading, isError } = usePublicPage(slug);

  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [preSelectedServiceId, setPreSelectedServiceId] = useState<number | undefined>();

  if (!slug) {
    return <NotFoundPage />;
  }

  if (isLoading) {
    return (
      <PublicPageShell>
        <PageSpinner />
      </PublicPageShell>
    );
  }

  if (isError || !page) {
    return (
      <PublicPageShell>
        <PageMessage icon="link_off" title="Page not found" body={`Nobody has claimed @${slug} yet.`} />
      </PublicPageShell>
    );
  }

  const { storefront, services, drops } = page;
  const location = [storefront.city, storefront.state].filter(Boolean).join(', ') || storefront.address;

  const openBooking = (serviceId?: number) => {
    setPreSelectedServiceId(serviceId);
    setIsBookingModalOpen(true);
  };

  return (
    <PublicPageShell>
      {/* ============================================================
       * HERO
       * ============================================================ */}
      <section className="bg-surface-container-low">
        <div className="max-w-3xl mx-auto px-4 sm:px-8 pt-16 pb-12 text-center">
          <div className="w-28 h-28 mx-auto mb-6 rounded-full bg-secondary-container overflow-hidden flex items-center justify-center">
            {storefront.avatar_url ? (
              <img src={storefront.avatar_url} alt={storefront.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl font-headline font-extrabold text-on-secondary-container">
                {storefront.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          <h1 className="text-4xl sm:text-5xl font-headline font-extrabold text-primary leading-tight tracking-tighter">
            {storefront.name}
          </h1>
          <p className="text-on-surface-variant text-sm mt-2">@{storefront.slug}</p>

          {storefront.description && (
            <p className="text-on-surface-variant text-lg leading-relaxed max-w-xl mx-auto mt-4">
              {storefront.description}
            </p>
          )}

          <div className="flex items-center justify-center gap-6 text-on-surface-variant mt-6 flex-wrap">
            {location && (
              <span className="flex items-center gap-1 text-sm font-medium">
                <Icon name="location_on" className="text-tertiary text-lg" />
                {location}
              </span>
            )}
            {storefront.instagram_handle && (
              <a
                href={`https://instagram.com/${storefront.instagram_handle.replace(/^@/, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                @{storefront.instagram_handle.replace(/^@/, '')}
              </a>
            )}
          </div>

          {services.length > 0 && (
            <button
              onClick={() => openBooking()}
              className="mt-8 bg-primary text-on-primary px-8 py-4 rounded-md font-headline font-bold hover:bg-primary-container transition-all inline-flex items-center gap-2 group"
            >
              Book an Appointment
              <Icon name="arrow_forward" className="transition-transform group-hover:translate-x-1" />
            </button>
          )}
        </div>
      </section>

      {/* ============================================================
       * DROPS
       * ============================================================ */}
      {drops.length > 0 && (
        <section className="max-w-3xl mx-auto px-4 sm:px-8 mt-12">
          <div className="flex items-center gap-4 mb-6">
            <span className="text-xs font-bold tracking-widest uppercase text-tertiary">Drops</span>
            <span className="h-px flex-1 bg-outline-variant/15" />
          </div>
          <div className="space-y-4">
            {drops.map((drop) => (
              <Link
                key={drop.id}
                to={`/@${storefront.slug}/drops/${drop.id}`}
                className="block bg-tertiary-fixed text-on-tertiary-fixed p-6 rounded-xl group hover:scale-[1.01] transition-all"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-xl font-headline font-bold">{drop.title}</h3>
                    <p className="text-sm opacity-80 mt-1">
                      {formatCalendarDate(drop.drop_date)} · {formatClock(drop.start_time)}–{formatClock(drop.end_time)}
                    </p>
                  </div>
                  <Icon name="arrow_forward" className="group-hover:translate-x-1 transition-transform" />
                </div>
                <SpotsMeter remaining={drop.remaining_spots} total={drop.total_spots} />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ============================================================
       * SERVICES
       * ============================================================ */}
      {services.length > 0 ? (
        <section className="max-w-3xl mx-auto px-4 sm:px-8 mt-12 mb-16">
          <div className="flex items-center gap-4 mb-6">
            <span className="text-xs font-bold tracking-widest uppercase text-on-surface-variant">Services</span>
            <span className="h-px flex-1 bg-outline-variant/15" />
          </div>
          <div className="space-y-4">
            {services.map((service) => (
              <button
                key={service.id}
                className="w-full text-left bg-surface-container-lowest rounded-xl p-6 group hover:bg-surface-container-low transition-all flex gap-4 items-center"
                style={{ boxShadow: '0 20px 40px rgba(27,28,26,0.05)' }}
                onClick={() => openBooking(service.id)}
              >
                {service.image_url && (
                  <img src={service.image_url} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-headline font-bold text-primary">{service.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-on-surface-variant mt-1">
                    <span className="flex items-center gap-1">
                      <Icon name="schedule" className="text-sm text-tertiary" />
                      {service.duration_minutes} min
                    </span>
                    {service.price ? (
                      <span className="flex items-center gap-1">
                        <Icon name="payments" className="text-sm text-tertiary" />${service.price}
                      </span>
                    ) : null}
                  </div>
                  {service.description && (
                    <p className="text-sm text-on-surface-variant leading-relaxed mt-2 line-clamp-2">{service.description}</p>
                  )}
                </div>
                <Icon name="arrow_forward" className="text-primary group-hover:translate-x-1 transition-transform" />
              </button>
            ))}
          </div>
        </section>
      ) : (
        <PageMessage icon="event_busy" title="Not taking bookings yet" body={`${storefront.name} hasn't added any services.`} />
      )}

      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        storefront={storefront}
        services={services}
        preSelectedServiceId={preSelectedServiceId}
      />
    </PublicPageShell>
  );
}
