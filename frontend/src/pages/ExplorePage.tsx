import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, MapPin, Loader2, X } from 'lucide-react';
import AppScaffold from '../components/layout/AppScaffold';
import StorefrontCard from '../components/marketplace/StorefrontCard';
import UniversalButton from '../components/universal/UniversalButton';
import UniversalCard from '../components/universal/UniversalCard';
import { useMarketplaceSearch, useGeolocation, useDebounce } from '../hooks/useMarketplaceSearch';
import { useAuth } from '../hooks/useAuth';
import { useStorefronts } from '../hooks/useStorefronts';

type LocationType = 'fixed' | 'mobile' | 'hybrid';

export default function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('query') || '');
  const debouncedQuery = useDebounce(searchQuery, 500);

  const { user, isAuthenticated } = useAuth();
  const { data: myStorefronts } = useStorefronts();
  const { location, error: geoError, isLoading: geoLoading, requestLocation, clearLocation } = useGeolocation();
  const activeLocationType = searchParams.get('location_type') as LocationType | null;

  // Create a Set of owned storefront IDs for quick lookup
  const ownedStorefrontIds = useMemo(() => {
    if (!isAuthenticated || !myStorefronts || user?.role !== 'vendor') return new Set<number>();
    return new Set(myStorefronts.map(sf => sf.id));
  }, [isAuthenticated, myStorefronts, user?.role]);

  const searchParamsObj = {
    query: debouncedQuery || undefined,
    location_type: activeLocationType || undefined,
    latitude: location?.latitude,
    longitude: location?.longitude,
    radius: location ? 25 : undefined,
    limit: 12,
    offset: 0,
  };

  const { data, isLoading, isError, error } = useMarketplaceSearch(searchParamsObj);

  const updateFilter = (key: string, value: string | null) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) newParams.set(key, value);
    else newParams.delete(key);
    setSearchParams(newParams);
  };

  const formatLocation = (storefront: any) => {
    if (storefront.location_type === 'mobile') {
      return storefront.service_area_city ? `Serves ${storefront.service_area_city} area` : 'Mobile service';
    }
    return [storefront.city, storefront.state].filter(Boolean).join(', ') || 'Location not specified';
  };

  return (
    <AppScaffold>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-v3-primary mb-3">Explore Vendors</h1>
          <p className="text-xl text-v3-secondary">Discover talented professionals and local services</p>
        </div>

        {/* Search Bar + Location */}
        <div className="mb-6 flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-v3-secondary" />
            <input
              type="text"
              placeholder="Search services, vendors, or locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-v3-border rounded-full
                focus:outline-none focus:ring-2 focus:ring-v3-accent focus:border-transparent"
            />
            {isLoading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-v3-accent" />}
          </div>

          <UniversalButton
            variant={location ? 'primary' : 'outline'}
            size="md"
            onClick={location ? clearLocation : requestLocation}
            isLoading={geoLoading}
            leftIcon={location ? <MapPin className="h-5 w-5" /> : undefined}
            rightIcon={location ? <X className="h-4 w-4" /> : undefined}
          >
            {location ? 'Near me' : 'Use my location'}
          </UniversalButton>
        </div>

        {/* Geolocation Error */}
        {geoError && (
          <UniversalCard className="bg-yellow-50 border-yellow-200 p-4 mb-6">
            <p className="text-yellow-800 text-sm">{geoError}. Showing all storefronts instead.</p>
          </UniversalCard>
        )}

        {/* Filter Chips */}
        <div className="mb-8 flex gap-3">
          {[
            { label: 'All', value: null },
            { label: 'Mobile', value: 'mobile' },
            { label: 'Fixed Location', value: 'fixed' },
          ].map((filter) => (
            <button
              key={filter.label}
              onClick={() => updateFilter('location_type', filter.value)}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                (filter.value === null && !activeLocationType) || activeLocationType === filter.value
                  ? 'bg-v3-primary text-white'
                  : 'bg-v3-surface-highlight text-v3-secondary hover:bg-zinc-300'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Results Count */}
        {data && (
          <div className="mb-6 text-sm text-v3-secondary">
            Showing {data.storefronts.length} of {data.total_count} storefronts
          </div>
        )}

        {/* Loading */}
        {isLoading && !data && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-v3-accent" />
          </div>
        )}

        {/* Error */}
        {isError && (
          <UniversalCard className="bg-red-50 border-red-200 p-6 max-w-md mx-auto">
            <h3 className="text-lg font-semibold text-red-900 mb-2">Error</h3>
            <p className="text-red-700">{error?.message || 'Failed to load storefronts'}</p>
          </UniversalCard>
        )}

        {/* Empty State */}
        {data && data.storefronts.length === 0 && (
          <UniversalCard className="p-12 text-center max-w-md mx-auto">
            <div className="text-6xl mb-4 opacity-30">🔍</div>
            <h3 className="text-2xl font-semibold text-v3-primary mb-2">No storefronts found</h3>
            <p className="text-v3-secondary mb-6">Try adjusting your filters or search query</p>
            <UniversalButton
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                updateFilter('location_type', null);
                clearLocation();
              }}
            >
              Clear all filters
            </UniversalButton>
          </UniversalCard>
        )}

        {/* Grid */}
        {data && data.storefronts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.storefronts.map((storefront) => (
              <StorefrontCard
                key={storefront.id}
                id={storefront.id}
                name={storefront.name}
                description={storefront.description}
                avatarUrl={storefront.avatar_url}
                locationType={storefront.location_type}
                isVerified={storefront.is_verified}
                location={formatLocation(storefront)}
                serviceCount={storefront.service_count}
                priceRange={storefront.price_range}
                distanceMiles={storefront.distance_miles}
                isOwned={ownedStorefrontIds.has(storefront.id)}
                serviceCategories={storefront.service_categories}
              />
            ))}
          </div>
        )}
      </div>
    </AppScaffold>
  );
}
