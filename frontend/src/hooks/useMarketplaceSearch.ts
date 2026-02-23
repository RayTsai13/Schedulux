import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { marketplaceApi, MarketplaceSearchParams } from '../services/api';

export const marketplaceSearchKeys = {
  search: (params: MarketplaceSearchParams) => ['marketplace', 'search', params] as const,
};

export function useMarketplaceSearch(params: MarketplaceSearchParams) {
  return useQuery({
    queryKey: marketplaceSearchKeys.search(params),
    queryFn: async () => {
      const response = await marketplaceApi.search(params);
      if (!response.success) {
        throw new Error(response.message || 'Failed to search storefronts');
      }
      return response.data!;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes
  });
}

export function useGeolocation() {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }

    setIsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setIsLoading(false);
      },
      (err) => {
        let errorMessage = 'Unable to retrieve location';
        if (err.code === err.PERMISSION_DENIED) {
          errorMessage = 'Location access denied';
        }
        setError(errorMessage);
        setIsLoading(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  };

  const clearLocation = () => {
    setLocation(null);
    setError(null);
  };

  return { location, error, isLoading, requestLocation, clearLocation };
}

export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}
