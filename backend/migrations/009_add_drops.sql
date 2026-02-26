-- Migration 009: Add Drops feature
-- Drops are curated time windows vendors publish (e.g., "Friday Night Session")
-- They act as first-class scheduling entities alongside schedule rules.

BEGIN;

-- Create drops table
CREATE TABLE IF NOT EXISTS drops (
  id SERIAL PRIMARY KEY,
  storefront_id INTEGER NOT NULL REFERENCES storefronts(id) ON DELETE CASCADE,
  service_id INTEGER REFERENCES services(id) ON DELETE SET NULL,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  drop_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  max_concurrent_appointments INTEGER NOT NULL DEFAULT 1,
  is_published BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMPTZ
);

-- Index for querying drops by storefront and date range
CREATE INDEX IF NOT EXISTS idx_drops_storefront_date
  ON drops (storefront_id, drop_date, is_active, deleted_at);

-- Index for public drops listing (published + active + not deleted)
CREATE INDEX IF NOT EXISTS idx_drops_public
  ON drops (storefront_id, is_published, is_active, deleted_at, drop_date);

-- Add drop_id FK to appointments table
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS drop_id INTEGER REFERENCES drops(id) ON DELETE SET NULL;

COMMIT;
