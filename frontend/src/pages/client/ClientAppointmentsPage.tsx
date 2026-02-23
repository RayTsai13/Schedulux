import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, MapPin, DollarSign, Filter, AlertCircle } from 'lucide-react';
import { useClientAppointments, useUpdateAppointmentStatus } from '../../hooks/useAppointments';
import AppScaffold from '../../components/layout/AppScaffold';
import UniversalButton from '../../components/universal/UniversalButton';
import UniversalCard from '../../components/universal/UniversalCard';
import type { Appointment } from '../../services/api';

export default function ClientAppointmentsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { data: appointments, isLoading } = useClientAppointments();
  const updateStatus = useUpdateAppointmentStatus();

  const handleCancelAppointment = async (appointmentId: number) => {
    if (confirm('Are you sure you want to cancel this appointment?')) {
      try {
        await updateStatus.mutateAsync({
          id: appointmentId,
          data: { status: 'cancelled' },
        });
      } catch (error) {
        console.error('Failed to cancel appointment:', error);
      }
    }
  };

  // Filter appointments
  const filteredAppointments = appointments?.filter((apt) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'upcoming') {
      return (
        (apt.status === 'pending' || apt.status === 'confirmed') &&
        new Date(apt.requested_start_datetime) > new Date()
      );
    }
    if (statusFilter === 'past') {
      return (
        apt.status === 'completed' ||
        (apt.status === 'confirmed' && new Date(apt.requested_start_datetime) < new Date())
      );
    }
    return apt.status === statusFilter;
  });

  // Sort by date (newest first)
  const sortedAppointments = [...(filteredAppointments || [])].sort(
    (a, b) =>
      new Date(b.requested_start_datetime).getTime() - new Date(a.requested_start_datetime).getTime()
  );

  if (isLoading) {
    return (
      <AppScaffold>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-v3-accent border-r-transparent" />
            <p className="mt-4 text-v3-secondary">Loading appointments...</p>
          </div>
        </div>
      </AppScaffold>
    );
  }

  return (
    <AppScaffold>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-v3-primary mb-2">My Appointments</h1>
            <p className="text-v3-secondary">View and manage your bookings</p>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-3">
            <Filter className="w-5 h-5 text-v3-secondary" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 rounded-xl border border-v3-border bg-v3-background text-v3-primary focus:outline-none focus:ring-2 focus:ring-v3-accent"
            >
              <option value="all">All Appointments</option>
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Appointments List */}
        {!sortedAppointments || sortedAppointments.length === 0 ? (
          <UniversalCard className="p-12 text-center">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-v3-secondary/50" />
            <h3 className="text-2xl font-semibold text-v3-primary mb-2">
              No appointments found
            </h3>
            <p className="text-v3-secondary mb-6">
              {statusFilter === 'all'
                ? "You haven't booked any appointments yet"
                : `No ${statusFilter} appointments`}
            </p>
            <UniversalButton variant="primary" onClick={() => (window.location.href = '/explore')}>
              Explore Services
            </UniversalButton>
          </UniversalCard>
        ) : (
          <div className="space-y-4">
            {sortedAppointments.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                onCancel={handleCancelAppointment}
              />
            ))}
          </div>
        )}
      </div>
    </AppScaffold>
  );
}

// Appointment Card Component
interface AppointmentCardProps {
  appointment: Appointment;
  onCancel: (id: number) => void;
}

function AppointmentCard({ appointment, onCancel }: AppointmentCardProps) {
  const isPending = appointment.status === 'pending';
  const isConfirmed = appointment.status === 'confirmed';
  const isCompleted = appointment.status === 'completed';
  const isCancelled = appointment.status === 'cancelled';
  const isDeclined = appointment.status === 'declined';

  const canCancel = isPending || isConfirmed;
  const isPast = new Date(appointment.requested_start_datetime) < new Date();

  return (
    <UniversalCard className="p-6">
      <div className="flex items-start justify-between">
        {/* Left: Appointment Info */}
        <div className="flex-1 space-y-4">
          {/* Status Badge & ID */}
          <div className="flex items-center gap-3">
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
            <span className="text-sm text-v3-secondary">Confirmation #{appointment.id}</span>
          </div>

          {/* Service Info */}
          <div>
            <h3 className="text-xl font-semibold text-v3-primary mb-1">
              Service ID: {appointment.service_id}
            </h3>
            <p className="text-sm text-v3-secondary">
              Storefront ID: {appointment.storefront_id}
            </p>
          </div>

          {/* Date & Time */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-v3-secondary" />
              <span className="text-sm text-v3-primary">
                {format(new Date(appointment.requested_start_datetime), 'MMMM d, yyyy')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-v3-secondary" />
              <span className="text-sm text-v3-primary">
                {format(new Date(appointment.requested_start_datetime), 'h:mm a')} -{' '}
                {format(new Date(appointment.requested_end_datetime), 'h:mm a')}
              </span>
            </div>
          </div>

          {/* Location */}
          {appointment.service_location_type && (
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-v3-secondary mt-0.5" />
              <span className="text-sm text-v3-secondary">
                {appointment.service_location_type === 'at_vendor'
                  ? 'At business location'
                  : appointment.service_location_type === 'at_client' && appointment.client_address
                  ? `At your location: ${appointment.client_address}`
                  : 'Location TBD'}
              </span>
            </div>
          )}

          {/* Price */}
          {appointment.price_quoted && (
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-v3-secondary" />
              <span className="text-sm font-medium text-v3-primary">${appointment.price_quoted}</span>
            </div>
          )}

          {/* Pending Notice */}
          {isPending && (
            <div className="flex items-start gap-2 p-3 bg-amber-500/5 rounded-lg border border-amber-500/20">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-700">
                Awaiting vendor confirmation. You'll be notified once confirmed.
              </p>
            </div>
          )}

          {/* Client Notes */}
          {appointment.client_notes && (
            <div className="p-3 bg-v3-background rounded-lg">
              <p className="text-xs font-medium text-v3-secondary mb-1">Your Notes:</p>
              <p className="text-sm text-v3-primary">{appointment.client_notes}</p>
            </div>
          )}

          {/* Vendor Notes */}
          {appointment.vendor_notes && (
            <div className="p-3 bg-v3-accent/5 rounded-lg border border-v3-accent/20">
              <p className="text-xs font-medium text-v3-accent mb-1">Vendor Notes:</p>
              <p className="text-sm text-v3-primary">{appointment.vendor_notes}</p>
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex flex-col gap-2 ml-6">
          {canCancel && !isPast && (
            <UniversalButton
              variant="outline"
              size="sm"
              onClick={() => onCancel(appointment.id)}
            >
              Cancel
            </UniversalButton>
          )}
          {(isCompleted || isCancelled || isDeclined || isPast) && (
            <span className="text-xs text-v3-secondary text-center">
              {isPast && !isCompleted ? 'Past' : 'Final'}
            </span>
          )}
        </div>
      </div>
    </UniversalCard>
  );
}
