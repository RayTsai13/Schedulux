import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  serviceApi,
  type Service,
  type CreateServiceRequest,
  type UpdateServiceRequest,
} from '../services/api';
import { toast } from 'sonner';

/**
 * TanStack Query Hooks for Service Management
 */

// Query Keys
export const serviceKeys = {
  all: (storefrontId: number) => ['services', storefrontId] as const,
  detail: (id: number) => ['services', 'detail', id] as const,
};

/**
 * Fetch all services for a storefront (including inactive)
 */
export function useServices(storefrontId: number | null) {
  return useQuery({
    queryKey: serviceKeys.all(storefrontId!),
    queryFn: async () => {
      const response = await serviceApi.getAllByStorefront(storefrontId!);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch services');
      }
      return response.data || [];
    },
    enabled: !!storefrontId,
  });
}

/**
 * Fetch a single service by ID
 */
export function useService(id: number | null) {
  return useQuery({
    queryKey: serviceKeys.detail(id!),
    queryFn: async () => {
      const response = await serviceApi.getById(id!);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch service');
      }
      return response.data!;
    },
    enabled: !!id,
  });
}

/**
 * Create a new service
 */
export function useCreateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ storefrontId, data }: { storefrontId: number; data: CreateServiceRequest }) =>
      serviceApi.create(storefrontId, data),

    onSuccess: (response, variables) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: serviceKeys.all(variables.storefrontId) });
        toast.success('Service created successfully!');
      } else {
        toast.error(response.message || 'Failed to create service');
      }
    },

    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create service');
    },
  });
}

/**
 * Update a service
 */
export function useUpdateService(storefrontId: number | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateServiceRequest }) =>
      serviceApi.update(id, data),

    onSuccess: (response, variables) => {
      if (response.success) {
        if (storefrontId) {
          queryClient.invalidateQueries({ queryKey: serviceKeys.all(storefrontId) });
        }
        queryClient.invalidateQueries({ queryKey: serviceKeys.detail(variables.id) });
        toast.success('Service updated successfully!');
      } else {
        toast.error(response.message || 'Failed to update service');
      }
    },

    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update service');
    },
  });
}

/**
 * Delete a service
 */
export function useDeleteService(storefrontId: number | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => serviceApi.delete(id),

    onSuccess: (response) => {
      if (response.success) {
        if (storefrontId) {
          queryClient.invalidateQueries({ queryKey: serviceKeys.all(storefrontId) });
        }
        toast.success('Service deleted successfully!');
      } else {
        toast.error(response.message || 'Failed to delete service');
      }
    },

    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete service');
    },
  });
}
