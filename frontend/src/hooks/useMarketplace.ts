import { useQuery } from '@tanstack/react-query';
import { marketplaceApi } from '../services/api';

/**
 * TanStack Query Hooks for Public Marketplace
 *
 * These hooks provide access to public storefront data without authentication
 */

// Query Keys
export const marketplaceKeys = {
  storefront: (id: number) => ['marketplace', 'storefront', id] as const,
};

/**
 * Fetch public storefront details by ID (no authentication required)
 */
export function usePublicStorefront(id: number | null) {
  return useQuery({
    queryKey: marketplaceKeys.storefront(id!),
    queryFn: async () => {
      const response = await marketplaceApi.getStorefront(id!);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch storefront');
      }
      return response.data!;
    },
    enabled: !!id, // Only run query if id is provided
  });
}
