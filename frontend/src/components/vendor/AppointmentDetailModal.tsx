import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, User, Mail, Phone, MapPin, MessageSquare, DollarSign } from 'lucide-react';
import { useUpdateAppointmentStatus } from '../../hooks/useAppointments';
import Modal from '../ui/Modal';
import UniversalButton from '../universal/UniversalButton';
import type { Appointment, AppointmentStatus } from '../../services/api';

interface AppointmentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment;
  storefrontId: number;
}

export default function AppointmentDetailModal({
  isOpen,
  onClose,
  appointment,
  storefrontId,
}: AppointmentDetailModalProps) {
  const updateStatus = useUpdateAppointmentStatus();
  const [vendorNotes, setVendorNotes] = useState(appointment.vendor_notes || '');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusUpdate = async (newStatus: AppointmentStatus) => {
    if (confirm(`Are you sure you want to ${newStatus} this appointment?`)) {
      setIsUpdating(true);
      try {
        await updateStatus.mutateAsync({
          id: appointment.id,
          data: {
            status: newStatus,
            vendor_notes: vendorNotes || undefined,
          },
        });
        onClose();
      } catch (error) {
        console.error('Failed to update appointment:', error);
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const isPending = appointment.status === 'pending';
  const isConfirmed = appointment.status === 'confirmed';
  const isCompleted = appointment.status === 'completed';
  const isCancelled = appointment.status === 'cancelled';
  const isDeclined = appointment.status === 'declined';

  const canConfirm = isPending;
  const canDecline = isPending;
  const canComplete = isConfirmed;
  const canCancel = isPending || isConfirmed;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Appointment Details"
      size="lg"
    >
      <div className="space-y-6">
        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              isPending
                ? 'bg-amber-500/10 text-amber-600'
                : isConfirmed
                ? 'bg-blue-500/10 text-blue-600'
                : isCompleted
                ? 'bg-green-500/10 text-green-600'
                : isCancelled
                ? 'bg-red-500/10 text-red-600'
                : 'bg-gray-500/10 text-gray-600'
            }`}
          >
            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
          </span>
          <span className="text-sm text-v3-secondary">
            ID: #{appointment.id}
          </span>
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-v3-secondary mt-0.5" />
            <div>
              <p className="text-sm font-medium text-v3-primary">Date</p>
              <p className="text-sm text-v3-secondary">
                {format(new Date(appointment.requested_start_datetime), 'MMMM d, yyyy')}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-v3-secondary mt-0.5" />
            <div>
              <p className="text-sm font-medium text-v3-primary">Time</p>
              <p className="text-sm text-v3-secondary">
                {format(new Date(appointment.requested_start_datetime), 'h:mm a')} -{' '}
                {format(new Date(appointment.requested_end_datetime), 'h:mm a')}
              </p>
            </div>
          </div>
        </div>

        {/* Client Info Section */}
        <div className="p-4 bg-v3-background rounded-xl border border-v3-border space-y-3">
          <h3 className="text-sm font-semibold text-v3-primary mb-3">Client Information</h3>

          <div className="flex items-center gap-3">
            <User className="w-4 h-4 text-v3-secondary" />
            <span className="text-sm text-v3-primary">Client ID: {appointment.client_id}</span>
          </div>

          {/* Note: In a real app, you'd fetch client details separately */}
          <p className="text-xs text-v3-secondary italic">
            Full client details would be displayed here (fetched from client API)
          </p>
        </div>

        {/* Service Info */}
        <div className="p-4 bg-v3-background rounded-xl border border-v3-border space-y-3">
          <h3 className="text-sm font-semibold text-v3-primary mb-3">Service Information</h3>

          <div className="space-y-2">
            <p className="text-sm text-v3-secondary">
              Service ID: {appointment.service_id}
            </p>
            {appointment.price_quoted && (
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-v3-secondary" />
                <span className="text-sm text-v3-primary">
                  Price: ${appointment.price_quoted}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Location */}
        {appointment.service_location_type && (
          <div className="p-4 bg-v3-background rounded-xl border border-v3-border">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-v3-secondary mt-0.5" />
              <div>
                <p className="text-sm font-medium text-v3-primary mb-1">Location</p>
                <p className="text-sm text-v3-secondary">
                  {appointment.service_location_type === 'at_vendor'
                    ? 'At business location'
                    : appointment.service_location_type === 'at_client' && appointment.client_address
                    ? `At client: ${appointment.client_address}`
                    : 'Location TBD'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Client Notes */}
        {appointment.client_notes && (
          <div className="p-4 bg-v3-background rounded-xl border border-v3-border">
            <div className="flex items-start gap-3">
              <MessageSquare className="w-5 h-5 text-v3-secondary mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-v3-primary mb-1">Client Notes</p>
                <p className="text-sm text-v3-secondary">{appointment.client_notes}</p>
              </div>
            </div>
          </div>
        )}

        {/* Vendor Notes */}
        <div>
          <label htmlFor="vendor_notes" className="block text-sm font-medium text-v3-primary mb-2">
            Vendor Notes (Optional)
          </label>
          <textarea
            id="vendor_notes"
            value={vendorNotes}
            onChange={(e) => setVendorNotes(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-v3-border bg-v3-background text-v3-primary placeholder:text-v3-secondary/50 focus:outline-none focus:ring-2 focus:ring-v3-accent"
            placeholder="Add notes about this appointment..."
            disabled={isCompleted || isCancelled || isDeclined}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-4 border-t border-v3-border">
          {canConfirm && (
            <UniversalButton
              variant="primary"
              onClick={() => handleStatusUpdate('confirmed')}
              disabled={isUpdating}
              isLoading={isUpdating}
            >
              Confirm Appointment
            </UniversalButton>
          )}

          {canDecline && (
            <UniversalButton
              variant="outline"
              onClick={() => handleStatusUpdate('declined')}
              disabled={isUpdating}
            >
              Decline
            </UniversalButton>
          )}

          {canComplete && (
            <UniversalButton
              variant="primary"
              onClick={() => handleStatusUpdate('completed')}
              disabled={isUpdating}
              isLoading={isUpdating}
            >
              Mark Complete
            </UniversalButton>
          )}

          {canCancel && (
            <UniversalButton
              variant="outline"
              onClick={() => handleStatusUpdate('cancelled')}
              disabled={isUpdating}
            >
              Cancel
            </UniversalButton>
          )}

          {(isCompleted || isCancelled || isDeclined) && (
            <UniversalButton variant="outline" onClick={onClose}>
              Close
            </UniversalButton>
          )}
        </div>
      </div>
    </Modal>
  );
}
