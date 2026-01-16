-- Migration: 005_marketplace_pivot.sql
-- Description: Add marketplace fields for flexible vendor identities and mobile services
-- Date: 2026-01-15

-- ============================================
-- STOREFRONTS TABLE CHANGES
-- ============================================

-- Add profile_type: individual (tutor, freelancer) vs business (salon, clinic)
ALTER TABLE storefronts
ADD COLUMN profile_type VARCHAR(20) DEFAULT 'business'
CHECK (profile_type IN ('individual', 'business'));

-- Add location_type: fixed (in-person at vendor), mobile (at client), hybrid (both)
ALTER TABLE storefronts
ADD COLUMN location_type VARCHAR(20) DEFAULT 'fixed'
CHECK (location_type IN ('fixed', 'mobile', 'hybrid'));

-- Service radius in miles (only for mobile/hybrid vendors)
ALTER TABLE storefronts
ADD COLUMN service_radius INTEGER CHECK (service_radius IS NULL OR service_radius > 0);

-- City name for "Serves within X miles of [City]" display (mobile vendors)
ALTER TABLE storefronts
ADD COLUMN service_area_city VARCHAR(100);

-- Avatar/profile image URL
ALTER TABLE storefronts
ADD COLUMN avatar_url VARCHAR(500);

-- Trust badge (manually verified by admin only)
ALTER TABLE storefronts
ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;

-- ============================================
-- APPOINTMENTS TABLE CHANGES
-- ============================================

-- Where the service will happen
ALTER TABLE appointments
ADD COLUMN service_location_type VARCHAR(20) DEFAULT 'at_vendor'
CHECK (service_location_type IN ('at_vendor', 'at_client'));

-- Client's address (required when service_location_type = 'at_client')
ALTER TABLE appointments
ADD COLUMN client_address TEXT;

-- Constraint: client_address required when at_client
ALTER TABLE appointments
ADD CONSTRAINT check_client_address_required
CHECK (
  service_location_type = 'at_vendor'
  OR (service_location_type = 'at_client' AND client_address IS NOT NULL)
);

-- ============================================
-- INDEXES FOR NEW COLUMNS
-- ============================================

-- Index for filtering storefronts by profile type
CREATE INDEX idx_storefronts_profile_type ON storefronts(profile_type) WHERE deleted_at IS NULL;

-- Index for filtering storefronts by location type
CREATE INDEX idx_storefronts_location_type ON storefronts(location_type) WHERE deleted_at IS NULL;

-- Index for verified storefronts (trust badge)
CREATE INDEX idx_storefronts_verified ON storefronts(is_verified) WHERE deleted_at IS NULL AND is_verified = TRUE;

-- Index for filtering appointments by service location type
CREATE INDEX idx_appointments_service_location_type ON appointments(service_location_type) WHERE deleted_at IS NULL;
