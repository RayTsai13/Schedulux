import { useCallback } from 'react';
import { format } from 'date-fns';
import {
  X,
  Calendar,
  Clock,
  User,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  MapPin,
} from 'lucide-react';

import {
  useUpdateAppointmentStatus,
  useConfirmAppointment,
  useCancelAppointment,
  useCompleteAppointment,
} from '../../hooks/useAppointments';
import type { Appointment, AppointmentStatus } from '../../services/api';

/**
 * AppointmentDetailModal - View and manage appointment details
 *
 * Features:
 * - Display appointment information
 * - Status transitions (confirm, cancel, complete, mark no-show)
 * - Notes viewing
 */

interface AppointmentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
}

const statusConfig: Record<
  AppointmentStatus,
  { label: string; bgColor: string; textColor: string; icon: React.ComponentType<{ className?: string }> }
> = {
  pending: {
    label: 'Pending',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    icon: AlertCircle,
  },
  confirmed: {
    label: 'Confirmed',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    icon: CheckCircle,
  },
  completed: {
    label: 'Completed',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    icon: CheckCircle,
  },
  cancelled: {
    label: 'Cancelled',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-600',
    icon: XCircle,
  },
  no_show: {
    label: 'No Show',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    icon: XCircle,
  },
};

export function AppointmentDetailModal({
  isOpen,
  onClose,
  appointment,
}: AppointmentDetailModalProps) {
  const confirmMutation = useConfirmAppointment();
  const cancelMutation = useCancelAppointment();
  const completeMutation = useCompleteAppointment();
  const updateStatusMutation = useUpdateAppointmentStatus();

  const handleConfirm = useCallback(() => {
    if (appointment) {
      confirmMutation.mutate(
        { id: appointment.id },
        { onSuccess: () => onClose() }
      );
    }
  }, [appointment, confirmMutation, onClose]);

  const handleCancel = useCallback(() => {
    if (appointment && window.confirm('Are you sure you want to cancel this appointment?')) {
      cancelMutation.mutate(
        { id: appointment.id },
        { onSuccess: () => onClose() }
      );
    }
  }, [appointment, cancelMutation, onClose]);

  const handleComplete = useCallback(() => {
    if (appointment) {
      completeMutation.mutate(
        { id: appointment.id },
        { onSuccess: () => onClose() }
      );
    }
  }, [appointment, completeMutation, onClose]);

  const handleMarkNoShow = useCallback(() => {
    if (appointment && window.confirm('Mark this appointment as no-show?')) {
      updateStatusMutation.mutate(
        { id: appointment.id, data: { status: 'no_show' } },
        { onSuccess: () => onClose() }
      );
    }
  }, [appointment, updateStatusMutation, onClose]);

  const isLoading =
    confirmMutation.isPending ||
    cancelMutation.isPending ||
    completeMutation.isPending ||
    updateStatusMutation.isPending;

  if (!isOpen || !appointment) return null;

  const status = statusConfig[appointment.status];
  const StatusIcon = status.icon;

  // Format dates
  const startDate = new Date(appointment.confirmed_start_datetime || appointment.requested_start_datetime);
  const endDate = new Date(appointment.confirmed_end_datetime || appointment.requested_end_datetime);

  // Determine available actions based on status
  const canConfirm = appointment.status === 'pending';
  const canCancel = appointment.status === 'pending' || appointment.status === 'confirmed';
  const canComplete = appointment.status === 'confirmed';
  const canMarkNoShow = appointment.status === 'confirmed';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-lg bg-white rounded-xl shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Appointment Details</h2>
                <p className="text-sm text-gray-500">ID: #{appointment.id}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Status Badge */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">Status</span>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${status.bgColor} ${status.textColor}`}
              >
                <StatusIcon className="w-4 h-4 mr-1.5" />
                {status.label}
              </span>
            </div>

            {/* Date & Time */}
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {format(startDate, 'EEEE, MMMM d, yyyy')}
                  </p>
                  <p className="text-sm text-gray-500">
                    {format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Duration:{' '}
                    {Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60))} minutes
                  </p>
                </div>
              </div>
            </div>

            {/* Service & Client Info */}
            <div className="space-y-3 pt-4 border-t border-gray-100">
              <div className="flex items-start space-x-3">
                <User className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Client #{appointment.client_id}</p>
                  <p className="text-sm text-gray-500">Service #{appointment.service_id}</p>
                </div>
              </div>

              {appointment.price_quoted && (
                <div className="flex items-center justify-between bg-gray-50 px-4 py-2 rounded-lg">
                  <span className="text-sm text-gray-600">Quoted Price</span>
                  <span className="text-sm font-semibold text-gray-900">
                    ${appointment.price_quoted.toFixed(2)}
                  </span>
                </div>
              )}

              {/* Service Location */}
              {appointment.service_location_type && (
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {appointment.service_location_type === 'at_client' ? 'At Client Location' : 'At Vendor Location'}
                    </p>
                    {appointment.client_address && (
                      <p className="text-sm text-gray-600 mt-1">{appointment.client_address}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            {(appointment.client_notes || appointment.vendor_notes) && (
              <div className="space-y-3 pt-4 border-t border-gray-100">
                {appointment.client_notes && (
                  <div className="flex items-start space-x-3">
                    <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Client Notes</p>
                      <p className="text-sm text-gray-600 mt-1">{appointment.client_notes}</p>
                    </div>
                  </div>
                )}
                {appointment.vendor_notes && (
                  <div className="flex items-start space-x-3">
                    <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Vendor Notes</p>
                      <p className="text-sm text-gray-600 mt-1">{appointment.vendor_notes}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Timestamps */}
            <div className="pt-4 border-t border-gray-100 text-xs text-gray-400">
              <p>Created: {format(new Date(appointment.created_at), 'MMM d, yyyy h:mm a')}</p>
              <p>Updated: {format(new Date(appointment.updated_at), 'MMM d, yyyy h:mm a')}</p>
            </div>
          </div>

          {/* Actions */}
          {(canConfirm || canCancel || canComplete || canMarkNoShow) && (
            <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <div className="flex flex-wrap gap-2">
                {canConfirm && (
                  <button
                    onClick={handleConfirm}
                    disabled={isLoading}
                    className="flex-1 min-w-[120px] bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {confirmMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    <span>Confirm</span>
                  </button>
                )}

                {canComplete && (
                  <button
                    onClick={handleComplete}
                    disabled={isLoading}
                    className="flex-1 min-w-[120px] bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {completeMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    <span>Complete</span>
                  </button>
                )}

                {canMarkNoShow && (
                  <button
                    onClick={handleMarkNoShow}
                    disabled={isLoading}
                    className="flex-1 min-w-[120px] bg-orange-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {updateStatusMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                    <span>No Show</span>
                  </button>
                )}

                {canCancel && (
                  <button
                    onClick={handleCancel}
                    disabled={isLoading}
                    className="flex-1 min-w-[120px] bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {cancelMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                    <span>Cancel</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AppointmentDetailModal;
