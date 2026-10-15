import { useQuery } from '@tanstack/react-query';
import { pageApi } from '../services/api';

export const pageKeys = {
  all: ['page'] as const,
  slug: (slug: string) => ['page', slug] as const,
};

/**
 * Public booking page by handle: storefront, services, and upcoming drops with spot counts.
 * Pass `live` on drop pages to poll so the "spots left" counter stays current.
 */
export function usePublicPage(slug: string | null, { live = false }: { live?: boolean } = {}) {
  return useQuery({
    queryKey: pageKeys.slug(slug!),
    queryFn: async () => {
      const response = await pageApi.getBySlug(slug!);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Page not found');
      }
      return response.data;
    },
    enabled: !!slug,
    retry: false,
    refetchInterval: live ? 30_000 : false,
  });
}
