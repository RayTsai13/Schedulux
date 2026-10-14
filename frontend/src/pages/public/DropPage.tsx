import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import PublicPageShell, { PageMessage, PageSpinner } from '../../components/public/PublicPageShell';
import SpotsMeter from '../../components/public/SpotsMeter';
import WaitlistForm from '../../components/public/WaitlistForm';
import BookingModal from '../../components/booking/BookingModal';
import { usePublicPage } from '../../hooks/usePage';
import { copyLink, formatCalendarDate, formatClock, pageUrl } from '../../lib/booking';
import NotFoundPage from '../NotFoundPage';
import { useHandle } from '../../hooks/useHandle';

/**
 * A single drop: /@slug/drops/:dropId — the link vendors share for a limited session.
 * Polls so the spots counter stays live while people are deciding.
 */
export default function DropPage() {
  const slug = useHandle();
  const { dropId } = useParams<{ dropId: string }>();
  const { data: page, isLoading, isError } = usePublicPage(slug, { live: true });
  const [isBookingOpen, setIsBookingOpen] = useState(false);

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

  const drop = page?.drops.find((d) => d.id === Number(dropId));

  if (isError || !page || !drop) {
    return (
      <PublicPageShell>
        <PageMessage icon="event_busy" title="This drop has ended" body="It may have finished or been taken down." />
        {page && (
          <p className="text-center mt-6">
            <Link to={`/@${page.storefront.slug}`} className="text-primary font-bold hover:underline underline-offset-4">
              See {page.storefront.name}'s page
            </Link>
          </p>
        )}
      </PublicPageShell>
    );
  }

  const { storefront, services } = page;
  const soldOut = drop.remaining_spots <= 0;
  const service = drop.service_id ? services.find((s) => s.id === drop.service_id) : null;

  return (
    <PublicPageShell>
      <section className="max-w-2xl mx-auto px-4 sm:px-8 pt-12 pb-16">
        <Link
          to={`/@${storefront.slug}`}
          className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors text-sm font-label mb-8"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          {storefront.name}
        </Link>

        <div className="bg-tertiary-fixed text-on-tertiary-fixed rounded-2xl p-8">
          <span className="text-xs font-bold tracking-widest uppercase">Drop</span>
          <h1 className="text-4xl sm:text-5xl font-headline font-extrabold leading-tight tracking-tighter mt-2">
            {drop.title}
          </h1>
          <p className="text-lg mt-4 font-medium">{formatCalendarDate(drop.drop_date)}</p>
          <p className="opacity-80">
            {formatClock(drop.start_time)}–{formatClock(drop.end_time)}
            {service && ` · ${service.name}`}
          </p>
          {drop.description && <p className="mt-6 leading-relaxed whitespace-pre-line">{drop.description}</p>}
        </div>

        <div className="mt-8 bg-surface-container-lowest rounded-2xl p-8 space-y-6" style={{ boxShadow: '0 20px 40px rgba(27,28,26,0.05)' }}>
          <SpotsMeter remaining={drop.remaining_spots} total={drop.total_spots} />

          {soldOut ? (
            <WaitlistForm dropId={drop.id} />
          ) : (
            <button
              onClick={() => setIsBookingOpen(true)}
              className="w-full bg-primary text-on-primary px-8 py-4 rounded-md font-headline font-bold hover:bg-primary-container transition-all"
            >
              Claim a spot
            </button>
          )}

          <button
            onClick={() => copyLink(pageUrl(storefront.slug, drop.id), 'Drop link')}
            className="w-full text-sm font-bold text-primary hover:underline underline-offset-4 flex items-center justify-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">link</span>
            Copy link to share
          </button>
        </div>
      </section>

      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        storefront={storefront}
        services={services}
        drop={drop}
      />
    </PublicPageShell>
  );
}
