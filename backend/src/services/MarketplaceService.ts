/**
 * MarketplaceService - Public Storefront Discovery
 *
 * This service enables consumers to search for storefronts based on location,
 * price, and other criteria without authentication. It's the core of the
 * marketplace discovery feature.
 *
 * Key Features:
 * - Geographic search using PostgreSQL earth distance (lat/long + radius)
 * - Text-based fallback search (city/state)
 * - Price range aggregation
 * - Service category filtering
 * - Trust badge filtering (is_verified)
 *
 * V1 Scope:
 * - Fixed vendors: Distance-based filtering
 * - Mobile/Hybrid vendors: Show all (no distance filtering)
 *
 * V2 Future:
 * - Mobile vendor distance filtering via geocoding service_area_city
 * - Real-time availability display
 * - Advanced filters (ratings, reviews, "open now")
 */

import { StorefrontModel } from '../models/Storefront';
import { ServiceModel } from '../models/Service';
import {
  MarketplaceSearchQuery,
  MarketplaceSearchResponse,
  MarketplaceStorefront,
  PublicStorefrontDetails,
  PublicService,
  PriceRange
} from '../types/marketplace';
import { Storefront, Service } from '../types';

export class MarketplaceService {
  /**
   * Search for storefronts in the marketplace
   *
   * Supports multiple search strategies:
   * 1. Geographic search (lat/long + radius) for fixed vendors
   * 2. Show all mobile/hybrid vendors (V1 - no distance filtering)
   * 3. Text-based fallback (city/state) when no coordinates
   * 4. Filters: price range, category, verified status, location/profile type
   *
   * @param query - Search parameters
   * @returns Marketplace search results with aggregated service data
   */
  static async searchStorefronts(
    query: MarketplaceSearchQuery
  ): Promise<MarketplaceSearchResponse> {
    const {
      latitude,
      longitude,
      radius = 25, // Default 25 miles
      city,
      state,
      query: searchText,
      location_type,
      profile_type,
      verified_only = false,
      category,
      min_price,
      max_price,
      limit = 20, // Default 20 results
      offset = 0
    } = query;

    // Validate limit (max 100)
    const safeLimit = Math.min(limit, 100);

    // Build SQL query based on search strategy
    const params: any[] = [];
    let paramIndex = 1;

    let sqlQuery = `
      SELECT
        s.*,
        COUNT(DISTINCT serv.id) as service_count,
        MIN(serv.price) as min_price,
        MAX(serv.price) as max_price,
        ARRAY_AGG(DISTINCT serv.category) FILTER (WHERE serv.category IS NOT NULL) as service_categories
    `;

    // Add distance calculation if geographic search
    if (latitude !== undefined && longitude !== undefined) {
      sqlQuery += `,
        earth_distance(
          ll_to_earth(s.latitude, s.longitude),
          ll_to_earth($${paramIndex}, $${paramIndex + 1})
        ) * 0.000621371 as distance_miles
      `;
      params.push(latitude, longitude);
      paramIndex += 2;
    } else {
      // No distance calculation - will be NULL
      sqlQuery += `, NULL as distance_miles`;
    }

    sqlQuery += `
      FROM storefronts s
      LEFT JOIN services serv ON serv.storefront_id = s.id
        AND serv.is_active = TRUE
        AND serv.deleted_at IS NULL
      WHERE s.deleted_at IS NULL
        AND s.is_active = TRUE
    `;

    // Geographic filtering
    if (latitude !== undefined && longitude !== undefined) {
      // Fixed vendors: within radius
      // Mobile/Hybrid: show all (V1 - no distance filtering)
      sqlQuery += `
        AND (
          (s.location_type = 'fixed'
            AND s.latitude IS NOT NULL
            AND s.longitude IS NOT NULL
            AND earth_distance(
              ll_to_earth(s.latitude, s.longitude),
              ll_to_earth($1, $2)
            ) * 0.000621371 <= $${paramIndex}
          )
          OR s.location_type IN ('mobile', 'hybrid')
        )
      `;
      params.push(radius);
      paramIndex++;
    }

    // Text-based city/state search (fallback or additional filter)
    if (city) {
      sqlQuery += ` AND LOWER(s.city) = LOWER($${paramIndex})`;
      params.push(city);
      paramIndex++;
    }

    if (state) {
      sqlQuery += ` AND LOWER(s.state) = LOWER($${paramIndex})`;
      params.push(state);
      paramIndex++;
    }

    // Free-text search (name or description)
    if (searchText) {
      sqlQuery += ` AND (
        LOWER(s.name) LIKE LOWER($${paramIndex})
        OR LOWER(s.description) LIKE LOWER($${paramIndex})
      )`;
      params.push(`%${searchText}%`);
      paramIndex++;
    }

    // Location type filter
    if (location_type) {
      sqlQuery += ` AND s.location_type = $${paramIndex}`;
      params.push(location_type);
      paramIndex++;
    }

    // Profile type filter
    if (profile_type) {
      sqlQuery += ` AND s.profile_type = $${paramIndex}`;
      params.push(profile_type);
      paramIndex++;
    }

    // Verified filter
    if (verified_only) {
      sqlQuery += ` AND s.is_verified = TRUE`;
    }

    // Group by storefront
    sqlQuery += ` GROUP BY s.id`;

    // Price range filtering (applied after aggregation via HAVING)
    const havingClauses: string[] = [];

    if (min_price !== undefined) {
      havingClauses.push(`MIN(serv.price) >= $${paramIndex}`);
      params.push(min_price);
      paramIndex++;
    }

    if (max_price !== undefined) {
      havingClauses.push(`MAX(serv.price) <= $${paramIndex}`);
      params.push(max_price);
      paramIndex++;
    }

    if (havingClauses.length > 0) {
      sqlQuery += ` HAVING ${havingClauses.join(' AND ')}`;
    }

    // Order by distance (nulls last for mobile vendors or no-coordinate searches)
    sqlQuery += ` ORDER BY distance_miles ASC NULLS LAST, s.is_verified DESC, s.name ASC`;

    // Pagination
    sqlQuery += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(safeLimit, offset);

    // Execute search
    const rows = await StorefrontModel.searchPublic(sqlQuery, params);

    // Map to MarketplaceStorefront objects
    const storefronts = rows.map((row) => this.mapToMarketplaceStorefront(row));

    return {
      storefronts,
      total_count: storefronts.length, // V2: Separate COUNT query for accurate pagination
      query
    };
  }

  /**
   * Get public storefront details with service listings
   *
   * No ownership check - public endpoint for marketplace pages
   *
   * @param storefrontId - The storefront ID
   * @returns Storefront with services, or null if not found/inactive
   */
  static async getPublicStorefront(
    storefrontId: number
  ): Promise<PublicStorefrontDetails | null> {
    // Fetch storefront (public view - no ownership check)
    const storefront = await StorefrontModel.findPublicById(storefrontId);

    if (!storefront) {
      return null;
    }

    // Fetch active services
    const services = await ServiceModel.findActiveByStorefrontId(storefrontId);

    // Get price summary
    const priceSummary = await ServiceModel.getPriceSummary(storefrontId);

    // Map to marketplace formats
    const marketplaceStorefront: MarketplaceStorefront = {
      id: storefront.id,
      name: storefront.name,
      description: storefront.description,
      avatar_url: storefront.avatar_url,
      profile_type: storefront.profile_type,
      location_type: storefront.location_type,
      is_verified: storefront.is_verified,

      // Location display
      city: storefront.city,
      state: storefront.state,
      address: storefront.location_type === 'fixed' ? storefront.address : undefined,
      service_radius: storefront.service_radius,
      service_area_city: storefront.service_area_city,
      distance_miles: undefined, // No distance in detail view

      // Service summary
      price_range: this.buildPriceRange(priceSummary),
      service_count: priceSummary.count,
      service_categories: priceSummary.categories || []
    };

    const publicServices: PublicService[] = services.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      duration_minutes: s.duration_minutes,
      price: s.price,
      category: s.category
    }));

    return {
      storefront: marketplaceStorefront,
      services: publicServices
    };
  }

  /**
   * Map database row to MarketplaceStorefront object
   *
   * Handles privacy considerations (no address for mobile vendors)
   */
  private static mapToMarketplaceStorefront(row: any): MarketplaceStorefront {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      avatar_url: row.avatar_url,
      profile_type: row.profile_type,
      location_type: row.location_type,
      is_verified: row.is_verified,

      // Location display
      city: row.city,
      state: row.state,
      address: row.location_type === 'fixed' ? row.address : undefined, // Privacy: hide mobile vendor address
      service_radius: row.service_radius,
      service_area_city: row.service_area_city,
      distance_miles: row.distance_miles ? parseFloat(row.distance_miles) : undefined,

      // Service summary (aggregated from query)
      price_range: this.buildPriceRange({
        min_price: row.min_price,
        max_price: row.max_price,
        count: row.service_count,
        categories: row.service_categories
      }),
      service_count: parseInt(row.service_count) || 0,
      service_categories: row.service_categories || []
    };
  }

  /**
   * Build PriceRange object from aggregated data
   *
   * Returns null if no services have prices
   */
  private static buildPriceRange(summary: {
    min_price: number | null;
    max_price: number | null;
    count: number;
    categories?: string[];
  }): PriceRange | null {
    if (summary.min_price === null || summary.max_price === null) {
      return null;
    }

    return {
      min: parseFloat(summary.min_price.toString()),
      max: parseFloat(summary.max_price.toString()),
      currency: 'USD' // V2: Multi-currency support
    };
  }
}
