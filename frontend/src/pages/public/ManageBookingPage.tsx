import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import PublicPageShell, { PageMessage, PageSpinner } from '../../components/public/PublicPageShell';
import RescheduleModal from '../../components/booking/RescheduleModal';
import Modal from '../../components/ui/Modal';
import UniversalButton from '../../components/universal/UniversalButton';
import { useCancelManagedBooking, useManagedBooking } from '../../hooks/useManageBooking';
import { formatInZone } from '../../lib/booking';
import type { AppointmentStatus } from '../../services/api';

// Mirrors STATUS_CFG in pages/vendor/VendorAppointmentsPage.tsx
const STATUS: Record<AppointmentStatus, { label: string; className: string; note: string }> = {
  pending: {
    label: 'Pending approval',
    className: 'bg-tertiary-fixed text-on-tertiary-fixed',
    note: "Your request is in. You'll get an email when it's confirmed.",
  },
  confirmed: {
    label: 'Confirmed',
    className: 'bg-secondary-container text-on-secondary-container',
    note: "You're booked. See you then!",
  },
  completed: {
    label: 'Completed',
    className: 'bg-secondary-fixed text-on-secondary-fixed',
    note: 'This appointment has taken place.',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-error-container text-on-error-container',
    note: 'This booking was cancelled.',
  },
  declined: {
    label: 'Declined',
    className: 'bg-surface-container-high text-on-surface-variant',
    note: "This request couldn't be accommodated.",
  },
  no_show: {
    label: 'No-show',
    className: 'bg-surface-container-high text-on-surface-variant',
    note: 'This appointment was marked as missed.',
  },
};

/**
 * Guest self-service: /manage/:token (link from the confirmation email)
 */
export default function ManageBookingPage() {
  const { token = '' } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { data: booking, isLoading, isError } = useManagedBooking(token || null);
  const cancel = useCancelManagedBooking(token);
  const [showReschedule, setShowReschedule] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (isLoading) {
    return (
      <PublicPageShell>
        <PageSpinner />
      </PublicPageShell>
    );
  }

  if (isError || !booking) {
    return (
      <PublicPageShell>
        <PageMessage
          icon="link_off"
          title="Booking not found"
          body="This link is invalid or has been replaced. If you rescheduled, use the link from your newest email."
        />
      </PublicPageShell>
    );
  }

  const tz = booking.storefront_timezone;
  const status = STATUS[booking.status];
  const isActive = booking.status === 'pending' || booking.status === 'confirmed';
  const isFuture = new Date(booking.requested_start_datetime) > new Date();

  return (
    <PublicPageShell>
      <section className="max-w-xl mx-auto px-4 sm:px-8 pt-12 pb-16 space-y-6">
        <div>
          <p className="text-sm text-on-surface-variant">Hi {booking.guest_name.split(' ')[0]},</p>
          <h1 className="text-3xl font-headline font-extrabold text-primary tracking-tight mt-1">Your booking</h1>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl p-8 space-y-6" style={{ boxShadow: '0 20px 40px rgba(27,28,26,0.05)' }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-headline font-bold text-primary">{booking.service_name}</h2>
              <Link to={`/@${booking.storefront_slug}`} className="text-sm text-on-surface-variant hover:text-primary">
                {booking.storefront_name}
              </Link>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${status.className}`}>{status.label}</span>
          </div>

          <div className="space-y-1">
            <p className="text-lg font-medium text-on-surface">
              {formatInZone(booking.requested_start_datetime, tz, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
            <p className="text-on-surface-variant">
              {formatInZone(booking.requested_start_datetime, tz, { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })}
            </p>
          </div>

          <p className="text-sm text-on-surface-variant">{status.note}</p>

          {booking.vendor_notes && (
            <div className="p-4 rounded-xl bg-surface-container-low text-sm">
              <p className="font-semibold text-on-surface mb-1">Note from {booking.storefront_name}</p>
              <p className="text-on-surface-variant whitespace-pre-line">{booking.vendor_notes}</p>
            </div>
          )}

          {isActive && isFuture && (
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <UniversalButton variant="primary" className="flex-1" onClick={() => setShowReschedule(true)}>
                Reschedule
              </UniversalButton>
              <UniversalButton variant="outline" className="flex-1" onClick={() => setConfirmCancel(true)}>
                Cancel booking
              </UniversalButton>
            </div>
          )}
        </div>

        <p className="text-xs text-on-surface-variant text-center">
          Booked as {booking.guest_email}. Anyone with this link can manage the booking.
        </p>
      </section>

      <RescheduleModal
        isOpen={showReschedule}
        onClose={() => setShowReschedule(false)}
        appointment={booking}
        onRescheduled={(next) => navigate(`/manage/${next.manage_token}`, { replace: true })}
      />

      <Modal isOpen={confirmCancel} onClose={() => setConfirmCancel(false)} title="Cancel this booking?" size="sm">
        <p className="text-on-surface-variant mb-6">
          {booking.storefront_name} will be notified and your spot will be released. This can't be undone.
        </p>
        <div className="flex justify-end gap-3">
          <UniversalButton variant="outline" onClick={() => setConfirmCancel(false)} disabled={cancel.isPending}>
            Keep it
          </UniversalButton>
          <UniversalButton
            variant="primary"
            isLoading={cancel.isPending}
            onClick={async () => {
              await cancel.mutateAsync();
              setConfirmCancel(false);
            }}
          >
            Cancel booking
          </UniversalButton>
        </div>
      </Modal>
    </PublicPageShell>
  );
}
