import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { manageApi } from '../services/api';
import { availabilityKeys } from './useAvailability';
import { pageKeys } from './usePage';

/**
 * Guest self-service hooks, authorized by the manage token from the confirmation email
 */

export const manageKeys = {
  token: (token: string) => ['manage', token] as const,
};

export function useManagedBooking(token: string | null) {
  return useQuery({
    queryKey: manageKeys.token(token!),
    queryFn: async () => {
      const response = await manageApi.get(token!);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Booking not found');
      }
      return response.data;
    },
    enabled: !!token,
    retry: false,
  });
}

export function useCancelManagedBooking(token: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => manageApi.cancel(token),
    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: manageKeys.token(token) });
        queryClient.invalidateQueries({ queryKey: availabilityKeys.all });
        queryClient.invalidateQueries({ queryKey: pageKeys.all });
        toast.success('Booking cancelled');
      } else {
        toast.error(response.message || 'Failed to cancel booking');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to cancel booking');
    },
  });
}

/**
 * Atomic cancel + rebook. The new booking has a new token, so callers should
 * navigate to /manage/<new token> on success.
 */
export function useRescheduleManagedBooking(token: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (startDatetime: string) => manageApi.reschedule(token, startDatetime),
    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ['manage'] });
        queryClient.invalidateQueries({ queryKey: availabilityKeys.all });
        queryClient.invalidateQueries({ queryKey: pageKeys.all });
        toast.success('Booking rescheduled');
      } else {
        toast.error(response.message || 'Failed to reschedule booking');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to reschedule booking');
    },
  });
}
