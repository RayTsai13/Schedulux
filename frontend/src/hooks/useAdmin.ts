import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../services/api';

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const res = await adminApi.getStats();
      if (!res.success || !res.data) throw new Error(res.message || 'Failed to fetch stats');
      return res.data;
    },
  });
}

export function useAdminStorefronts(limit = 20, offset = 0) {
  return useQuery({
    queryKey: ['admin', 'storefronts', limit, offset],
    queryFn: async () => {
      const res = await adminApi.getStorefronts(limit, offset);
      if (!res.success || !res.data) throw new Error(res.message || 'Failed to fetch storefronts');
      return res.data;
    },
  });
}

export function useVerifyStorefront() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, is_verified }: { id: number; is_verified: boolean }) =>
      adminApi.setVerified(id, is_verified),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
  });
}
