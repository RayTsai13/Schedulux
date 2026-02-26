import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  dropApi,
  type CreateDropRequest,
  type UpdateDropRequest,
} from '../services/api';
import { toast } from 'sonner';
import { availabilityKeys } from './useAvailability';

// Query Keys
export const dropKeys = {
  all: (storefrontId: number) => ['drops', storefrontId] as const,
  public: (storefrontId: number) => ['drops', 'public', storefrontId] as const,
  detail: (id: number) => ['drops', 'detail', id] as const,
};

/**
 * Fetch all drops for a storefront (vendor, includes unpublished)
 */
export function useDrops(storefrontId: number | null) {
  return useQuery({
    queryKey: dropKeys.all(storefrontId!),
    queryFn: async () => {
      const response = await dropApi.getByStorefront(storefrontId!);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch drops');
      }
      return response.data || [];
    },
    enabled: !!storefrontId,
  });
}

/**
 * Fetch published drops for a storefront (public, no auth)
 */
export function usePublicDrops(storefrontId: number | null) {
  return useQuery({
    queryKey: dropKeys.public(storefrontId!),
    queryFn: async () => {
      const response = await dropApi.getPublic(storefrontId!);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch drops');
      }
      return response.data || [];
    },
    enabled: !!storefrontId,
  });
}

/**
 * Create a new drop
 */
export function useCreateDrop() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ storefrontId, data }: { storefrontId: number; data: CreateDropRequest }) =>
      dropApi.create(storefrontId, data),

    onSuccess: (response, variables) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: dropKeys.all(variables.storefrontId) });
        queryClient.invalidateQueries({ queryKey: availabilityKeys.all });
        toast.success('Drop created successfully!');
      } else {
        toast.error(response.message || 'Failed to create drop');
      }
    },

    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create drop');
    },
  });
}

/**
 * Update a drop
 */
export function useUpdateDrop(storefrontId: number | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateDropRequest }) =>
      dropApi.update(id, data),

    onSuccess: (response, variables) => {
      if (response.success) {
        if (storefrontId) {
          queryClient.invalidateQueries({ queryKey: dropKeys.all(storefrontId) });
        }
        queryClient.invalidateQueries({ queryKey: dropKeys.detail(variables.id) });
        queryClient.invalidateQueries({ queryKey: availabilityKeys.all });
        toast.success('Drop updated successfully!');
      } else {
        toast.error(response.message || 'Failed to update drop');
      }
    },

    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update drop');
    },
  });
}

/**
 * Delete a drop
 */
export function useDeleteDrop(storefrontId: number | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => dropApi.delete(id),

    onSuccess: (response) => {
      if (response.success) {
        if (storefrontId) {
          queryClient.invalidateQueries({ queryKey: dropKeys.all(storefrontId) });
        }
        queryClient.invalidateQueries({ queryKey: availabilityKeys.all });
        toast.success('Drop deleted successfully!');
      } else {
        toast.error(response.message || 'Failed to delete drop');
      }
    },

    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete drop');
    },
  });
}
