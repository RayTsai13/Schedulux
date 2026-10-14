-- =========================================
-- 011: Drops pivot
-- =========================================
-- Schedulux narrows from a marketplace to a single-vendor booking page:
--   * Clients book as guests (name + email); a private manage_token replaces login
--   * Each storefront gets a public slug for /@handle URLs
--   * Sold-out drops collect a waitlist
--   * Marketplace, geolocation, verification, and mobile-service columns are removed

-- -----------------------------------------
-- Guest bookings
-- -----------------------------------------
ALTER TABLE appointments ALTER COLUMN client_id DROP NOT NULL;

ALTER TABLE appointments
  ADD COLUMN guest_name VARCHAR(100),
  ADD COLUMN guest_email VARCHAR(255),
  ADD COLUMN guest_phone VARCHAR(30),
  ADD COLUMN manage_token VARCHAR(64);

-- Backfill existing (seed) bookings from the client's user record
UPDATE appointments a
SET guest_name = TRIM(u.first_name || ' ' || u.last_name),
    guest_email = u.email,
    guest_phone = u.phone
FROM users u
WHERE a.client_id = u.id;

UPDATE appointments
SET manage_token = md5(random()::text || id::text) || md5(clock_timestamp()::text || random()::text)
WHERE manage_token IS NULL;

-- Any orphaned rows still lacking contact details get a placeholder
UPDATE appointments
SET guest_name = COALESCE(guest_name, 'Guest'),
    guest_email = COALESCE(guest_email, 'unknown@example.com')
WHERE guest_name IS NULL OR guest_email IS NULL;

ALTER TABLE appointments
  ALTER COLUMN guest_name SET NOT NULL,
  ALTER COLUMN guest_email SET NOT NULL,
  ALTER COLUMN manage_token SET NOT NULL;

CREATE UNIQUE INDEX idx_appointments_manage_token ON appointments(manage_token);
CREATE INDEX idx_appointments_guest_email ON appointments(storefront_id, lower(guest_email))
  WHERE deleted_at IS NULL;

-- -----------------------------------------
-- Public slugs
-- -----------------------------------------
ALTER TABLE storefronts ADD COLUMN slug VARCHAR(30);

-- Backfill: lowercase name, non-alphanumerics → '-', trimmed, suffixed with id for uniqueness
UPDATE storefronts
SET slug = LEFT(
      COALESCE(NULLIF(TRIM(BOTH '-' FROM regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g')), ''), 'page'),
      24
    ) || '-' || id;

ALTER TABLE storefronts
  ALTER COLUMN slug SET NOT NULL,
  ADD CONSTRAINT storefronts_slug_format CHECK (slug ~ '^[a-z0-9](?:[a-z0-9-]{1,28})[a-z0-9]$');

CREATE UNIQUE INDEX idx_storefronts_slug ON storefronts(slug);

-- -----------------------------------------
-- Drop waitlist
-- -----------------------------------------
CREATE TABLE drop_waitlist (
  id SERIAL PRIMARY KEY,
  drop_id INTEGER NOT NULL REFERENCES drops(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notified_at TIMESTAMP NULL
);

CREATE UNIQUE INDEX idx_drop_waitlist_drop_email ON drop_waitlist(drop_id, lower(email));

-- -----------------------------------------
-- Remove marketplace / mobile-service columns
-- -----------------------------------------
ALTER TABLE appointments
  DROP CONSTRAINT IF EXISTS check_client_address_required,
  DROP COLUMN IF EXISTS service_location_type,
  DROP COLUMN IF EXISTS client_address;

ALTER TABLE storefronts
  DROP CONSTRAINT IF EXISTS storefronts_layout_mode_check,
  DROP COLUMN IF EXISTS latitude,
  DROP COLUMN IF EXISTS longitude,
  DROP COLUMN IF EXISTS service_radius,
  DROP COLUMN IF EXISTS service_area_city,
  DROP COLUMN IF EXISTS location_type,
  DROP COLUMN IF EXISTS profile_type,
  DROP COLUMN IF EXISTS layout_mode,
  DROP COLUMN IF EXISTS is_verified;
