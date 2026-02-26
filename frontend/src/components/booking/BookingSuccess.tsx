import { format } from 'date-fns';
import { CheckCircle } from 'lucide-react';
import UniversalCard from '../universal/UniversalCard';
import UniversalButton from '../universal/UniversalButton';
import type { Appointment } from '../../services/api';

interface BookingSuccessProps {
  appointment: Appointment;
  storefrontName: string;
  serviceName: string;
  onClose: () => void;
}

export default function BookingSuccess({
  appointment,
  storefrontName,
  serviceName,
  onClose,
}: BookingSuccessProps) {
  return (
    <div className="text-center space-y-6">
      {/* Success Icon */}
      <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
        <CheckCircle className="w-10 h-10 text-green-600" />
      </div>

      <div>
        <h3 className="text-2xl font-bold text-v3-primary mb-2">
          Booking Confirmed!
        </h3>
        <p className="text-v3-secondary">
          Your appointment has been successfully booked.
        </p>
      </div>

      {/* Appointment Details Card */}
      <UniversalCard className="text-left">
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-v3-secondary">Confirmation #:</span>
            <span className="font-mono font-medium text-v3-primary">#{appointment.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-v3-secondary">Vendor:</span>
            <span className="font-medium text-v3-primary">{storefrontName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-v3-secondary">Service:</span>
            <span className="font-medium text-v3-primary">{serviceName}</span>
          </div>
          <div className="flex justify-between items-start">
            <span className="text-v3-secondary">Date & Time:</span>
            <div className="text-right font-medium text-v3-primary">
              <div>{format(new Date(appointment.requested_start_datetime), 'EEEE, MMMM d, yyyy')}</div>
              <div className="text-xs text-v3-secondary mt-1">
                {format(new Date(appointment.requested_start_datetime), 'h:mm a')} -{' '}
                {format(new Date(appointment.requested_end_datetime), 'h:mm a')}
              </div>
            </div>
          </div>
          {appointment.client_address && (
            <div className="flex justify-between items-start">
              <span className="text-v3-secondary">Location:</span>
              <span className="font-medium text-v3-primary text-right max-w-[60%]">
                {appointment.client_address}
              </span>
            </div>
          )}
          {appointment.status === 'pending' && (
            <div className="mt-4 pt-3 border-t border-v3-border">
              <p className="text-xs text-v3-secondary">
                Status: <span className="font-medium text-yellow-600">Pending Approval</span>
              </p>
              <p className="text-xs text-v3-secondary mt-1">
                The vendor will review and confirm your appointment request.
              </p>
            </div>
          )}
        </div>
      </UniversalCard>

      {/* Action Buttons */}
      <div className="space-y-3">
        <UniversalButton
          variant="primary"
          size="lg"
          onClick={() => window.location.href = '/my-appointments'}
          className="w-full"
        >
          View My Appointments
        </UniversalButton>

        <UniversalButton
          variant="outline"
          size="lg"
          onClick={onClose}
          className="w-full"
        >
          Done
        </UniversalButton>
      </div>
    </div>
  );
}
