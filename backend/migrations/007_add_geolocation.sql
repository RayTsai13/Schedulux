/**
 * Migration 007: Add Geolocation Support for Marketplace Discovery
 *
 * Adds geographic coordinates and city/state fields to storefronts table
 * to enable distance-based search for marketplace discovery.
 *
 * Features:
 * - latitude/longitude for precise fixed-location distance search
 * - city/state for text-based fallback search
 * - PostgreSQL earthdistance extension for efficient geographic queries
 * - Spatial GiST index for "storefronts within X miles" queries
 */

-- Add geographic coordinates for fixed-location storefronts
ALTER TABLE storefronts
ADD COLUMN latitude DECIMAL(10, 8) NULL,
ADD COLUMN longitude DECIMAL(11, 8) NULL;

-- Add city/state for text-based fallback search
ALTER TABLE storefronts
ADD COLUMN city VARCHAR(100) NULL,
ADD COLUMN state VARCHAR(50) NULL;

-- Enable PostgreSQL Earth Distance extension
-- Uses Haversine formula for accurate distance calculations
-- No external APIs needed, fast with spatial indexing
CREATE EXTENSION IF NOT EXISTS earthdistance CASCADE;

-- Spatial index for efficient distance queries
-- Supports "find storefronts within X miles of (lat, long)" queries
CREATE INDEX idx_storefronts_location ON storefronts
USING gist(ll_to_earth(latitude, longitude))
WHERE deleted_at IS NULL AND latitude IS NOT NULL AND longitude IS NOT NULL;

-- Text search index for city/state fallback (when no coordinates)
CREATE INDEX idx_storefronts_city_state ON storefronts(city, state)
WHERE deleted_at IS NULL;

-- Verification query (optional - for testing after migration)
-- SELECT earth_distance(
--   ll_to_earth(40.7128, -74.0060),  -- New York
--   ll_to_earth(34.0522, -118.2437)   -- Los Angeles
-- ) * 0.000621371 as distance_miles;
-- Expected: ~2451 miles
