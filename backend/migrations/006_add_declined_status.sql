-- Migration: 006_add_declined_status.sql
-- Description: Add 'declined' status for approval workflow
-- Date: 2026-01-15

-- Drop the existing check constraint on appointments.status
ALTER TABLE appointments
DROP CONSTRAINT IF EXISTS appointments_status_check;

-- Add new check constraint with 'declined' status
ALTER TABLE appointments
ADD CONSTRAINT appointments_status_check
CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show', 'declined'));

-- Update index for confirmed datetime to include declined exclusion
DROP INDEX IF EXISTS idx_appointments_confirmed_datetime;
CREATE INDEX idx_appointments_confirmed_datetime
ON appointments(storefront_id, confirmed_start_datetime, confirmed_end_datetime)
WHERE status IN ('confirmed', 'completed') AND deleted_at IS NULL;
