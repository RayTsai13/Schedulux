import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  appointmentApi,
  bookingApi,
  type AppointmentStatus,
  type CreateAppointmentRequest,
} from '../services/api';
import { toast } from 'sonner';

/**
 * TanStack Query Hooks for Appointment Management
 */

// Query Keys
export const appointmentKeys = {
  all: ['appointments'] as const,
  storefront: (storefrontId: number) => ['appointments', 'storefront', storefrontId] as const,
  client: () => ['appointments', 'client'] as const,
  detail: (id: number) => ['appointments', 'detail', id] as const,
};

/**
 * Fetch appointments for a storefront (vendor calendar view)
 * Supports filtering by status and date range
 */
export function useStorefrontAppointments(
  storefrontId: number | null,
  params?: { status?: string; start_date?: string; end_date?: string }
) {
  return useQuery({
    queryKey: [...appointmentKeys.storefront(storefrontId!), params],
    queryFn: async () => {
      const response = await appointmentApi.getByStorefront(storefrontId!, params);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch appointments');
      }
      return response.data || [];
    },
    enabled: !!storefrontId,
  });
}

/**
 * Fetch appointments for the current client
 */
export function useClientAppointments(params?: { status?: string; upcoming?: boolean }) {
  return useQuery({
    queryKey: [...appointmentKeys.client(), params],
    queryFn: async () => {
      const response = await appointmentApi.getClientAppointments(params);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch appointments');
      }
      return response.data || [];
    },
  });
}

/**
 * Fetch a single appointment by ID
 */
export function useAppointment(id: number | null) {
  return useQuery({
    queryKey: appointmentKeys.detail(id!),
    queryFn: async () => {
      const response = await appointmentApi.getById(id!);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch appointment');
      }
      return response.data!;
    },
    enabled: !!id,
  });
}

/**
 * Update appointment status mutation
 */
export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: { status: AppointmentStatus; vendor_notes?: string; internal_notes?: string };
    }) => appointmentApi.updateStatus(id, data),

    onSuccess: (response, variables) => {
      if (response.success) {
        // Invalidate all appointment queries to refresh data
        queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
        queryClient.invalidateQueries({ queryKey: appointmentKeys.detail(variables.id) });
        toast.success('Appointment updated successfully!');
      } else {
        toast.error(response.message || 'Failed to update appointment');
      }
    },

    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update appointment');
    },
  });
}

/**
 * Cancel appointment mutation (convenience wrapper)
 */
export function useCancelAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) =>
      appointmentApi.cancel(id, reason),

    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
        toast.success('Appointment cancelled successfully!');
      } else {
        toast.error(response.message || 'Failed to cancel appointment');
      }
    },

    onError: (error: Error) => {
      toast.error(error.message || 'Failed to cancel appointment');
    },
  });
}

/**
 * Confirm appointment mutation (vendor only)
 */
export function useConfirmAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, vendorNotes }: { id: number; vendorNotes?: string }) =>
      appointmentApi.confirm(id, vendorNotes),

    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
        toast.success('Appointment confirmed!');
      } else {
        toast.error(response.message || 'Failed to confirm appointment');
      }
    },

    onError: (error: Error) => {
      toast.error(error.message || 'Failed to confirm appointment');
    },
  });
}

/**
 * Complete appointment mutation (vendor only)
 */
export function useCompleteAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, internalNotes }: { id: number; internalNotes?: string }) =>
      appointmentApi.complete(id, internalNotes),

    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
        toast.success('Appointment marked as completed!');
      } else {
        toast.error(response.message || 'Failed to complete appointment');
      }
    },

    onError: (error: Error) => {
      toast.error(error.message || 'Failed to complete appointment');
    },
  });
}

/**
 * Create/book a new appointment (client booking)
 */
export function useCreateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAppointmentRequest) => bookingApi.create(data),

    onSuccess: (response) => {
      if (response.success) {
        // Invalidate all appointment queries to refresh lists
        queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
        toast.success('Appointment booked successfully!');
      } else {
        toast.error(response.message || 'Failed to book appointment');
      }
    },

    onError: (error: Error) => {
      toast.error(error.message || 'Failed to book appointment');
    },
  });
}
