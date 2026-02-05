-- Migration: 008_visual_portfolio.sql
-- Description: Add visual portfolio and branding fields for creator-focused UX
-- Date: 2026-02-05

-- ============================================
-- SERVICES TABLE CHANGES
-- ============================================
ALTER TABLE services
ADD COLUMN image_url VARCHAR(500),
ADD COLUMN is_featured BOOLEAN DEFAULT FALSE;

-- ============================================
-- STOREFRONTS TABLE CHANGES
-- ============================================
ALTER TABLE storefronts
ADD COLUMN layout_mode VARCHAR(20) DEFAULT 'list',
ADD COLUMN theme_color VARCHAR(20) DEFAULT 'purple',
ADD COLUMN instagram_handle VARCHAR(100);

-- Add constraint for layout_mode enumeration
ALTER TABLE storefronts
ADD CONSTRAINT storefronts_layout_mode_check
CHECK (layout_mode IN ('list', 'grid'));

-- ============================================
-- SCHEDULE RULES TABLE CHANGES
-- ============================================
ALTER TABLE schedule_rules
ADD COLUMN name VARCHAR(100);

-- ============================================
-- INDEXES FOR NEW COLUMNS
-- ============================================

-- Index for featured services discovery (only index active featured services)
CREATE INDEX idx_services_featured
ON services(is_featured)
WHERE deleted_at IS NULL AND is_featured = TRUE AND is_active = TRUE;

-- Index for storefront layout mode filtering (if needed for analytics)
CREATE INDEX idx_storefronts_layout_mode
ON storefronts(layout_mode)
WHERE deleted_at IS NULL;

-- Index for named schedule rules (helpful for searching specific drops)
CREATE INDEX idx_schedule_rules_name
ON schedule_rules(name)
WHERE deleted_at IS NULL AND name IS NOT NULL;
