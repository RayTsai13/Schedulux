import { useQuery } from '@tanstack/react-query';
import { availabilityApi, type AvailabilityResponse } from '../services/api';

/**
 * TanStack Query Hook for Fetching Availability
 *
 * Fetches available appointment slots for a storefront/service.
 * This is a public endpoint - no authentication required.
 */

// Query Keys
export const availabilityKeys = {
  all: ['availability'] as const,
  slots: (storefrontId: number, serviceId: number, startDate: string, endDate: string) =>
    ['availability', storefrontId, serviceId, startDate, endDate] as const,
};

interface UseAvailabilityParams {
  storefrontId: number | null;
  serviceId: number | null;
  startDate: string; // YYYY-MM-DD format
  endDate: string;   // YYYY-MM-DD format
}

/**
 * Fetch available slots for a service within a date range
 */
export function useAvailability({
  storefrontId,
  serviceId,
  startDate,
  endDate,
}: UseAvailabilityParams) {
  return useQuery({
    queryKey: availabilityKeys.slots(storefrontId!, serviceId!, startDate, endDate),
    queryFn: async (): Promise<AvailabilityResponse> => {
      const response = await availabilityApi.getSlots(storefrontId!, {
        service_id: serviceId!,
        start_date: startDate,
        end_date: endDate,
      });
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch availability');
      }
      return response.data!;
    },
    enabled: !!storefrontId && !!serviceId && !!startDate && !!endDate,
    // Availability data can change frequently, so keep it fresh
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true,
  });
}
