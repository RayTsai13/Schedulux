import UniversalCard from '../universal/UniversalCard';
import type { PublicStorefront, AvailableSlot, Service } from '../../services/api';
import { formatInZone } from '../../lib/booking';

export interface GuestDetails {
  name: string;
  email: string;
  phone: string;
}

interface BookingStepConfirmProps {
  storefront: PublicStorefront;
  service: Service;
  selectedSlot: AvailableSlot;
  guest: GuestDetails;
  guestErrors: Partial<Record<keyof GuestDetails, string>>;
  clientNotes: string;
  onGuestChange: (guest: GuestDetails) => void;
  onClientNotesChange: (notes: string) => void;
  error?: string | null;
}

const inputClass =
  'w-full px-4 py-3 border-2 border-outline-variant rounded-xl bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent';

export default function BookingStepConfirm({
  storefront,
  service,
  selectedSlot,
  guest,
  guestErrors,
  clientNotes,
  onGuestChange,
  onClientNotesChange,
  error,
}: BookingStepConfirmProps) {
  const field = (key: keyof GuestDetails) => ({
    value: guest[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => onGuestChange({ ...guest, [key]: e.target.value }),
    'aria-invalid': !!guestErrors[key],
  });

  return (
    <div className="space-y-6">
      {/* Review Card */}
      <UniversalCard>
        <h3 className="text-lg font-semibold text-on-surface mb-4">Booking Summary</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-on-surface-variant">Service:</span>
            <span className="font-medium text-on-surface">{service.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-on-surface-variant">Date:</span>
            <span className="font-medium text-on-surface">
              {formatInZone(selectedSlot.start_datetime, storefront.timezone, {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-on-surface-variant">Time:</span>
            <span className="font-medium text-on-surface">
              {selectedSlot.local_start_time} - {selectedSlot.local_end_time}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-on-surface-variant">Duration:</span>
            <span className="font-medium text-on-surface">{service.duration_minutes} minutes</span>
          </div>
          {service.price ? (
            <div className="flex justify-between pt-3 border-t border-outline-variant">
              <span className="text-on-surface-variant">Price:</span>
              <span className="font-semibold text-lg text-on-surface">${service.price}</span>
            </div>
          ) : null}
        </div>
      </UniversalCard>

      {/* Guest details — no account needed */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-on-surface">Your details</h3>
          <p className="text-sm text-on-surface-variant">
            No account needed. We'll email you a private link to manage this booking.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label htmlFor="guest-name" className="block text-sm font-medium text-on-surface mb-2">
              Name <span className="text-error">*</span>
            </label>
            <input id="guest-name" autoComplete="name" className={inputClass} {...field('name')} />
            {guestErrors.name && <p className="text-error text-xs mt-1">{guestErrors.name}</p>}
          </div>
          <div>
            <label htmlFor="guest-email" className="block text-sm font-medium text-on-surface mb-2">
              Email <span className="text-error">*</span>
            </label>
            <input id="guest-email" type="email" autoComplete="email" className={inputClass} {...field('email')} />
            {guestErrors.email && <p className="text-error text-xs mt-1">{guestErrors.email}</p>}
          </div>
          <div>
            <label htmlFor="guest-phone" className="block text-sm font-medium text-on-surface mb-2">
              Phone (optional)
            </label>
            <input id="guest-phone" type="tel" autoComplete="tel" className={inputClass} {...field('phone')} />
            {guestErrors.phone && <p className="text-error text-xs mt-1">{guestErrors.phone}</p>}
          </div>
        </div>
      </div>

      {/* Optional Notes */}
      <div>
        <label htmlFor="client-notes" className="block text-sm font-medium text-on-surface mb-2">
          Special Requests (Optional)
        </label>
        <textarea
          id="client-notes"
          value={clientNotes}
          onChange={(e) => onClientNotesChange(e.target.value)}
          placeholder={`Anything ${storefront.name} should know...`}
          rows={3}
          maxLength={1000}
          className={`${inputClass} resize-none`}
        />
      </div>

      {/* Error Display */}
      {error && (
        <UniversalCard className="bg-error-container border-2 border-error/30">
          <p className="text-on-error-container text-sm">{error}</p>
        </UniversalCard>
      )}
    </div>
  );
}
