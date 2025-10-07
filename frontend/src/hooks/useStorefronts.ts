import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { storefrontApi, type Storefront, type CreateStorefrontRequest, type UpdateStorefrontRequest } from '../services/api';
import { toast } from 'sonner';

/**
 * TanStack Query Hooks for Storefront Management
 *
 * These hooks provide a clean interface for managing storefront data
 * with automatic caching, loading states, and error handling.
 */

// Query Keys - Centralized for consistency
export const storefrontKeys = {
  all: ['storefronts'] as const,
  detail: (id: number) => ['storefronts', id] as const,
};

/**
 * Fetch all storefronts for the current vendor
 */
export function useStorefronts() {
  return useQuery({
    queryKey: storefrontKeys.all,
    queryFn: async () => {
      const response = await storefrontApi.getAll();
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch storefronts');
      }
      return response.data || [];
    },
  });
}

/**
 * Fetch a single storefront by ID
 */
export function useStorefront(id: number | null) {
  return useQuery({
    queryKey: storefrontKeys.detail(id!),
    queryFn: async () => {
      const response = await storefrontApi.getById(id!);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch storefront');
      }
      return response.data!;
    },
    enabled: !!id, // Only run query if id is provided
  });
}

/**
 * Create a new storefront
 */
export function useCreateStorefront() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateStorefrontRequest) => storefrontApi.create(data),

    onSuccess: (response) => {
      if (response.success) {
        // Invalidate and refetch storefronts list
        queryClient.invalidateQueries({ queryKey: storefrontKeys.all });
        toast.success('Storefront created successfully!');
      } else {
        toast.error(response.message || 'Failed to create storefront');
      }
    },

    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create storefront');
    },
  });
}

/**
 * Update an existing storefront
 */
export function useUpdateStorefront() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateStorefrontRequest }) =>
      storefrontApi.update(id, data),

    onSuccess: (response, variables) => {
      if (response.success) {
        // Invalidate both the list and the specific storefront
        queryClient.invalidateQueries({ queryKey: storefrontKeys.all });
        queryClient.invalidateQueries({ queryKey: storefrontKeys.detail(variables.id) });
        toast.success('Storefront updated successfully!');
      } else {
        toast.error(response.message || 'Failed to update storefront');
      }
    },

    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update storefront');
    },
  });
}

/**
 * Delete a storefront
 */
export function useDeleteStorefront() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => storefrontApi.delete(id),

    onSuccess: (response) => {
      if (response.success) {
        // Invalidate storefronts list
        queryClient.invalidateQueries({ queryKey: storefrontKeys.all });
        toast.success('Storefront deleted successfully!');
      } else {
        toast.error(response.message || 'Failed to delete storefront');
      }
    },

    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete storefront');
    },
  });
}
