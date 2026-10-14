import { useState } from 'react';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import Modal from '../ui/Modal';
import UniversalButton from '../universal/UniversalButton';
import BookingStepDateTime from './BookingStepDateTime';
import { useRescheduleManagedBooking } from '../../hooks/useManageBooking';
import type { ManagedBooking, AvailableSlot } from '../../services/api';
import { formatInZone } from '../../lib/booking';

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: ManagedBooking;
  /** Called with the new booking (which has a new manage token) */
  onRescheduled: (booking: ManagedBooking) => void;
}

type RescheduleStep = 'select' | 'confirm';

export default function RescheduleModal({ isOpen, onClose, appointment, onRescheduled }: RescheduleModalProps) {
  const [step, setStep] = useState<RescheduleStep>('select');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reschedule = useRescheduleManagedBooking(appointment.manage_token);
  const tz = appointment.storefront_timezone;

  const handleClose = () => {
    setStep('select');
    setSelectedDate(null);
    setSelectedSlot(null);
    setError(null);
    onClose();
  };

  const handleConfirm = async () => {
    if (!selectedSlot) return;
    setError(null);

    try {
      const response = await reschedule.mutateAsync(selectedSlot.start_datetime);

      if (response.success && response.data) {
        handleClose();
        onRescheduled(response.data.new);
      } else {
        setError(response.message || 'Failed to reschedule. Please try a different time.');
        setStep('select');
      }
    } catch (err) {
      setError((err instanceof Error && err.message) || 'Failed to reschedule. Please try a different time.');
      setStep('select');
    }
  };

  const title = step === 'select' ? 'Pick a New Time' : 'Confirm Reschedule';

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} size="lg">
      <div className="min-h-[400px]">
        {step === 'select' && (
          <>
            {error && (
              <div className="mb-4 p-3 bg-error-container border border-error/30 rounded-lg text-sm text-on-error-container">
                {error}
              </div>
            )}
            <BookingStepDateTime
              storefrontId={appointment.storefront_id}
              serviceId={appointment.service_id}
              selectedDate={selectedDate}
              selectedSlot={selectedSlot}
              onSelectDate={setSelectedDate}
              onSelectSlot={setSelectedSlot}
            />
          </>
        )}

        {step === 'confirm' && selectedSlot && (
          <div className="space-y-6">
            <p className="text-on-surface-variant">
              Your booking will move to the new time and {appointment.storefront_name} will need to re-confirm.
              Your old manage link will stop working; we'll email you a new one.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              {/* Old time */}
              <div className="p-4 bg-error-container border border-error/30 rounded-xl text-center">
                <p className="text-xs font-medium text-error mb-2">Current Time</p>
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-error" />
                  <span className="text-sm font-semibold text-on-error-container">
                    {formatInZone(appointment.requested_start_datetime, tz, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Clock className="w-4 h-4 text-error" />
                  <span className="text-sm text-on-error-container">
                    {formatInZone(appointment.requested_start_datetime, tz, { hour: 'numeric', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex justify-center">
                <ArrowRight className="w-6 h-6 text-on-surface-variant" />
              </div>

              {/* New time */}
              <div className="p-4 bg-secondary-container border border-secondary/30 rounded-xl text-center">
                <p className="text-xs font-medium text-secondary mb-2">New Time</p>
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-secondary" />
                  <span className="text-sm font-semibold text-on-secondary-container">
                    {formatInZone(selectedSlot.start_datetime, tz, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Clock className="w-4 h-4 text-secondary" />
                  <span className="text-sm text-on-secondary-container">
                    {selectedSlot.local_start_time}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-sm text-on-surface-variant">
              <p>Service: {appointment.service_name}</p>
              <p>At: {appointment.storefront_name}</p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-6 pt-4 border-t border-outline-variant">
        {step === 'confirm' && (
          <UniversalButton
            variant="outline"
            onClick={() => setStep('select')}
            disabled={reschedule.isPending}
          >
            Back
          </UniversalButton>
        )}
        <UniversalButton
          variant="primary"
          onClick={step === 'select' ? () => setStep('confirm') : handleConfirm}
          disabled={
            step === 'select'
              ? !selectedSlot
              : reschedule.isPending
          }
          isLoading={reschedule.isPending}
          className={step === 'select' ? 'ml-auto' : ''}
        >
          {step === 'select' ? 'Next' : 'Confirm Reschedule'}
        </UniversalButton>
      </div>
    </Modal>
  );
}
