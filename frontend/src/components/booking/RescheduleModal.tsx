import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import Modal from '../ui/Modal';
import UniversalButton from '../universal/UniversalButton';
import BookingStepDateTime from './BookingStepDateTime';
import { useRescheduleAppointment } from '../../hooks/useAppointments';
import type { Appointment, AvailableSlot } from '../../services/api';

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment;
}

type RescheduleStep = 'select' | 'confirm';

export default function RescheduleModal({ isOpen, onClose, appointment }: RescheduleModalProps) {
  const [step, setStep] = useState<RescheduleStep>('select');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reschedule = useRescheduleAppointment();

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
      const response = await reschedule.mutateAsync({
        id: appointment.id,
        startDatetime: selectedSlot.start_datetime,
      });

      if (response.success) {
        handleClose();
      } else {
        setError(response.message || 'Failed to reschedule. Please try a different time.');
        setStep('select');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to reschedule. Please try a different time.');
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
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
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
            <p className="text-v3-secondary">
              Your appointment will be moved to the new time. The vendor will need to re-confirm.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              {/* Old time */}
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-center">
                <p className="text-xs font-medium text-red-600 mb-2">Current Time</p>
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-semibold text-red-900">
                    {format(new Date(appointment.requested_start_datetime), 'MMM d, yyyy')}
                  </span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Clock className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-800">
                    {format(new Date(appointment.requested_start_datetime), 'h:mm a')}
                  </span>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex justify-center">
                <ArrowRight className="w-6 h-6 text-v3-secondary" />
              </div>

              {/* New time */}
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-center">
                <p className="text-xs font-medium text-green-600 mb-2">New Time</p>
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-semibold text-green-900">
                    {selectedDate && format(selectedDate, 'MMM d, yyyy')}
                  </span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Clock className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-800">
                    {selectedSlot.local_start_time}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-sm text-v3-secondary">
              <p>Service: {appointment.service_name || `Service #${appointment.service_id}`}</p>
              <p>At: {appointment.storefront_name || `Storefront #${appointment.storefront_id}`}</p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-6 pt-4 border-t border-v3-border">
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
              ? !selectedDate || !selectedSlot
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
