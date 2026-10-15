import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { storefrontApi, type CreateStorefrontRequest, type UpdateStorefrontRequest } from '../services/api';
import { toast } from 'sonner';
import { pageKeys } from './usePage';

/**
 * TanStack Query Hooks for the vendor's booking page (one storefront per vendor)
 */

// Query Keys - Centralized for consistency
export const storefrontKeys = {
  mine: ['storefronts', 'mine'] as const,
  slug: (slug: string) => ['storefronts', 'slug', slug] as const,
};

/**
 * The signed-in vendor's page; resolves to null until they create one
 */
export function useMyStorefront() {
  return useQuery({
    queryKey: storefrontKeys.mine,
    queryFn: async () => {
      const response = await storefrontApi.getMine();
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch your page');
      }
      return response.data ?? null;
    },
  });
}

/**
 * Whether a handle can be claimed. Pass '' to skip.
 */
export function useSlugAvailability(slug: string) {
  return useQuery({
    queryKey: storefrontKeys.slug(slug),
    queryFn: async () => {
      const response = await storefrontApi.checkSlug(slug);
      return response.data?.available ?? false;
    },
    enabled: slug.length >= 3,
    staleTime: 10_000,
  });
}

/**
 * Create the vendor's page (onboarding)
 */
export function useCreateStorefront() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateStorefrontRequest) => storefrontApi.create(data),

    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: storefrontKeys.mine });
        toast.success('Your page is live!');
      } else {
        toast.error(response.message || 'Failed to create your page');
      }
    },

    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create your page');
    },
  });
}

/**
 * Update the vendor's page
 */
export function useUpdateStorefront() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateStorefrontRequest }) =>
      storefrontApi.update(id, data),

    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: storefrontKeys.mine });
        queryClient.invalidateQueries({ queryKey: pageKeys.all });
        toast.success('Page updated');
      } else {
        toast.error(response.message || 'Failed to update your page');
      }
    },

    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update your page');
    },
  });
}
