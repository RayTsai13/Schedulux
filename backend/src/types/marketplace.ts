/**
 * Marketplace Types - Public Discovery and Search
 *
 * These types support the marketplace discovery feature, enabling
 * clients to search for storefronts based on location, price,
 * and other criteria without authentication.
 */

/**
 * Marketplace search query parameters
 *
 * Supports both geographic search (lat/long + radius) and text-based
 * fallback search (city/state).
 */
export interface MarketplaceSearchQuery {
  // Geographic search
  latitude?: number;          // Client location latitude
  longitude?: number;         // Client location longitude
  radius?: number;            // Search radius in miles (default: 25)

  // Text search fallback
  city?: string;              // City name for text-based search
  state?: string;             // State/province for text-based search
  query?: string;             // Free-text search (name, description, service category)

  // Filters
  location_type?: 'fixed' | 'mobile' | 'hybrid';
  profile_type?: 'individual' | 'business';
  verified_only?: boolean;    // Show only admin-verified vendors
  category?: string;          // Service category filter (e.g., "haircut", "tutoring")
  min_price?: number;         // Minimum service price
  max_price?: number;         // Maximum service price

  // Pagination
  limit?: number;             // Results per page (default: 20, max: 100)
  offset?: number;            // Skip first N results
}

/**
 * Price range for a storefront's services
 *
 * Calculated from MIN/MAX of active service prices
 */
export interface PriceRange {
  min: number;
  max: number;
  currency: string;           // Future: multi-currency support (e.g., "USD")
}

/**
 * Enriched storefront for marketplace display
 *
 * Public-facing view with aggregated service data and distance calculations
 */
export interface MarketplaceStorefront {
  // Core storefront info
  id: number;
  name: string;
  description?: string;
  avatar_url?: string;
  profile_type: 'individual' | 'business';
  location_type: 'fixed' | 'mobile' | 'hybrid';
  is_verified: boolean;       // Trust badge

  // Location display
  city?: string;
  state?: string;
  address?: string;           // Full address for fixed locations, null for mobile (privacy)
  service_radius?: number;    // For mobile/hybrid vendors
  service_area_city?: string; // "Serves within X miles of [City]"
  distance_miles?: number;    // Distance from search location (if lat/long provided)

  // Service summary (aggregated)
  price_range: PriceRange | null;  // Null if no services have prices
  service_count: number;            // Number of active services
  service_categories: string[];     // Unique categories offered
}

/**
 * Marketplace search response
 *
 * Returns paginated results with query echo for debugging
 */
export interface MarketplaceSearchResponse {
  storefronts: MarketplaceStorefront[];
  total_count: number;        // Total matching results (for pagination UI)
  query: MarketplaceSearchQuery; // Echo back the query
}

/**
 * Public storefront detail with service listings
 *
 * Used for storefront detail pages (public, no auth)
 */
export interface PublicStorefrontDetails {
  storefront: MarketplaceStorefront;
  services: PublicService[];
}

/**
 * Public service (simplified view)
 *
 * Excludes internal fields like buffer_time_minutes, is_active
 */
export interface PublicService {
  id: number;
  name: string;
  description?: string;
  duration_minutes: number;
  price?: number;
  category?: string;
}
