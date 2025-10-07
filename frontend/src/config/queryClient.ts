import { QueryClient } from '@tanstack/react-query';

/**
 * TanStack Query Client Configuration
 *
 * This configures how React Query handles server state caching,
 * refetching, and error handling across the entire application.
 */

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 5 minutes
      // During this time, React Query won't refetch automatically
      staleTime: 1000 * 60 * 5, // 5 minutes

      // Keep data in cache for 10 minutes even when unused
      // This allows instant display when navigating back to a page
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)

      // Don't refetch when user switches back to browser tab
      // You can enable this for real-time data if needed
      refetchOnWindowFocus: false,

      // Retry failed requests 1 time before showing error
      retry: 1,

      // Don't refetch on component mount if data is still fresh
      refetchOnMount: false,
    },
    mutations: {
      // Retry failed mutations once (e.g., network issues)
      retry: 1,
    },
  },
});
