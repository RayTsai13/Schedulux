import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import UniversalCard from '../universal/UniversalCard';
import UniversalButton from '../universal/UniversalButton';
import type { Appointment } from '../../services/api';
import { copyLink, formatInZone, manageUrl } from '../../lib/booking';

interface BookingSuccessProps {
  appointment: Appointment;
  storefrontName: string;
  serviceName: string;
  timezone: string;
  onClose: () => void;
}

export default function BookingSuccess({
  appointment,
  storefrontName,
  serviceName,
  timezone,
  onClose,
}: BookingSuccessProps) {
  const link = manageUrl(appointment.manage_token);

  return (
    <div className="text-center space-y-6">
      {/* Success Icon */}
      <div className="mx-auto w-16 h-16 bg-secondary-container rounded-full flex items-center justify-center">
        <CheckCircle className="w-10 h-10 text-primary" />
      </div>

      <div>
        <h3 className="text-2xl font-bold text-on-surface mb-2">
          Request sent!
        </h3>
        <p className="text-on-surface-variant">
          {storefrontName} will confirm shortly. A confirmation is on its way to{' '}
          <span className="font-medium text-on-surface">{appointment.guest_email}</span>.
        </p>
      </div>

      {/* Appointment Details Card */}
      <UniversalCard className="text-left">
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-on-surface-variant">Service:</span>
            <span className="font-medium text-on-surface">{serviceName}</span>
          </div>
          <div className="flex justify-between items-start">
            <span className="text-on-surface-variant">Date & Time:</span>
            <div className="text-right font-medium text-on-surface">
              <div>
                {formatInZone(appointment.requested_start_datetime, timezone, {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
              <div className="text-xs text-on-surface-variant mt-1">
                {formatInZone(appointment.requested_start_datetime, timezone, {
                  hour: 'numeric',
                  minute: '2-digit',
                  timeZoneName: 'short',
                })}
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-outline-variant">
            <p className="text-xs text-on-surface-variant">
              Status: <span className="font-medium text-on-tertiary-fixed-variant">Pending approval</span>
            </p>
          </div>
        </div>
      </UniversalCard>

      {/* Manage link */}
      <UniversalCard className="text-left bg-surface-container-low">
        <p className="text-sm font-semibold text-on-surface mb-1">Your private manage link</p>
        <p className="text-xs text-on-surface-variant mb-3">
          Use it to reschedule or cancel. Anyone with this link can manage the booking, so keep it to yourself.
        </p>
        <div className="flex gap-2">
          <input
            readOnly
            value={link}
            onFocus={(e) => e.target.select()}
            className="flex-1 min-w-0 px-3 py-2 text-xs font-mono rounded-lg bg-surface-container-lowest border border-outline-variant"
          />
          <UniversalButton variant="outline" size="sm" onClick={() => copyLink(link)}>
            Copy
          </UniversalButton>
        </div>
      </UniversalCard>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Link to={`/manage/${appointment.manage_token}`} className="block">
          <UniversalButton variant="primary" size="lg" className="w-full">
            Manage Booking
          </UniversalButton>
        </Link>

        <UniversalButton variant="outline" size="lg" onClick={onClose} className="w-full">
          Done
        </UniversalButton>
      </div>
    </div>
  );
}
