-- =========================================
-- SCHEDULUX DATABASE SCHEMA - CLEAN VERSION
-- =========================================
-- This is a properly formatted version of the current database schema
-- Based on 003_fixed_schema.sql but with clean formatting and organization
-- Created: August 24, 2025

-- =========================================
-- FUNCTIONS
-- =========================================

-- Function to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Function to track schedule rule changes
CREATE OR REPLACE FUNCTION track_schedule_rule_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO schedule_rules_history (schedule_rule_id, action, rule_data)
        VALUES (NEW.id, 'created', row_to_json(NEW.*));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO schedule_rules_history (schedule_rule_id, action, rule_data)
        VALUES (NEW.id, 'updated', row_to_json(NEW.*));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO schedule_rules_history (schedule_rule_id, action, rule_data)
        VALUES (OLD.id, 'deleted', row_to_json(OLD.*));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE 'plpgsql';

-- Function to track appointment changes
CREATE OR REPLACE FUNCTION track_appointment_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO appointment_history (appointment_id, action, appointment_data, changed_at)
        VALUES (NEW.id, 'created', row_to_json(NEW), CURRENT_TIMESTAMP);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Track specific status changes
        IF OLD.status != NEW.status THEN
            INSERT INTO appointment_history (
                appointment_id, action, field_name, old_value, new_value, appointment_data, changed_at
            ) VALUES (
                NEW.id, NEW.status, 'status', OLD.status, NEW.status, row_to_json(NEW), CURRENT_TIMESTAMP
            );
        ELSE
            -- General update
            INSERT INTO appointment_history (appointment_id, action, appointment_data, changed_at)
            VALUES (NEW.id, 'updated', row_to_json(NEW), CURRENT_TIMESTAMP);
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE 'plpgsql';

-- Function to update appointment slot booking counts
CREATE OR REPLACE FUNCTION update_slot_booking_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.slot_id IS NOT NULL THEN
        -- Increase booking count
        UPDATE appointment_slots 
        SET current_bookings = current_bookings + 1
        WHERE id = NEW.slot_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' AND OLD.slot_id IS NOT NULL THEN
        -- Decrease booking count
        UPDATE appointment_slots 
        SET current_bookings = current_bookings - 1
        WHERE id = OLD.slot_id;
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Handle slot changes
        IF OLD.slot_id IS NOT NULL AND NEW.slot_id IS NULL THEN
            -- Removed from slot
            UPDATE appointment_slots 
            SET current_bookings = current_bookings - 1
            WHERE id = OLD.slot_id;
        ELSIF OLD.slot_id IS NULL AND NEW.slot_id IS NOT NULL THEN
            -- Added to slot
            UPDATE appointment_slots 
            SET current_bookings = current_bookings + 1
            WHERE id = NEW.slot_id;
        ELSIF OLD.slot_id != NEW.slot_id AND OLD.slot_id IS NOT NULL AND NEW.slot_id IS NOT NULL THEN
            -- Changed slots
            UPDATE appointment_slots 
            SET current_bookings = current_bookings - 1
            WHERE id = OLD.slot_id;
            UPDATE appointment_slots 
            SET current_bookings = current_bookings + 1
            WHERE id = NEW.slot_id;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE 'plpgsql';

-- =========================================
-- CORE TABLES
-- =========================================

-- Users Table (for vendors AND clients AND admin)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL CHECK (role IN ('vendor', 'client', 'admin')),
    timezone VARCHAR(50) DEFAULT 'UTC',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Storefronts (different businesses)
CREATE TABLE storefronts (
    id SERIAL PRIMARY KEY,
    vendor_id INTEGER NOT NULL REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    timezone VARCHAR(50) DEFAULT 'UTC',
    business_hours JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Services (static services with predefined time slots)
CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    storefront_id INTEGER NOT NULL REFERENCES storefronts(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    buffer_time_minutes INTEGER DEFAULT 0 CHECK (buffer_time_minutes >= 0),
    price DECIMAL(10,2),
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- =========================================
-- SCHEDULING TABLES
-- =========================================

-- Flexible Scheduling Rules for monthly/weekly/daily availability settings
CREATE TABLE schedule_rules (
    id SERIAL PRIMARY KEY,
    storefront_id INTEGER NOT NULL REFERENCES storefronts(id),
    service_id INTEGER REFERENCES services(id), -- if NULL = applies to all services
    
    -- Rule type and timing
    rule_type VARCHAR(20) NOT NULL CHECK (rule_type IN ('weekly', 'daily', 'monthly')),
    priority INTEGER NOT NULL DEFAULT 1 CHECK (priority > 0),
    
    -- Time specifications (only fill relevant fields based on rule_type)
    day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
    specific_date DATE,
    month INTEGER CHECK (month BETWEEN 1 AND 12),
    year INTEGER,
    
    -- Time slots
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    
    -- Availability settings
    is_available BOOLEAN DEFAULT TRUE,
    max_concurrent_appointments INTEGER DEFAULT 1 CHECK (max_concurrent_appointments > 0),
    
    -- Metadata
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    -- Ensure proper rule constraints
    CONSTRAINT valid_rule_type_data CHECK (
        (rule_type = 'weekly' AND day_of_week IS NOT NULL AND specific_date IS NULL AND month IS NULL) OR
        (rule_type = 'daily' AND specific_date IS NOT NULL AND day_of_week IS NULL AND month IS NULL) OR
        (rule_type = 'monthly' AND month IS NOT NULL AND specific_date IS NULL AND day_of_week IS NULL)
    ),
    CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Predefined time slots provided by the vendor
CREATE TABLE appointment_slots (
    id SERIAL PRIMARY KEY,
    storefront_id INTEGER NOT NULL REFERENCES storefronts(id),
    service_id INTEGER NOT NULL REFERENCES services(id),
    
    -- Time details
    start_datetime TIMESTAMP NOT NULL,
    end_datetime TIMESTAMP NOT NULL,
    
    -- Capacity management
    max_bookings INTEGER DEFAULT 1 CHECK (max_bookings > 0),
    current_bookings INTEGER DEFAULT 0 CHECK (current_bookings >= 0),
    
    -- Availability
    is_available BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    -- Constraints
    CONSTRAINT valid_slot_times CHECK (end_datetime > start_datetime),
    CONSTRAINT valid_booking_count CHECK (current_bookings <= max_bookings)
);

-- =========================================
-- APPOINTMENT TABLES
-- =========================================

-- Main appointments table (both request-based and slot-based bookings)
CREATE TABLE appointments (
    id SERIAL PRIMARY KEY,
    
    -- Required relationships
    client_id INTEGER NOT NULL REFERENCES users(id),
    storefront_id INTEGER NOT NULL REFERENCES storefronts(id),
    service_id INTEGER NOT NULL REFERENCES services(id),
    slot_id INTEGER REFERENCES appointment_slots(id), -- NULL for request-based appointments
    
    -- Timing information
    requested_start_datetime TIMESTAMP NOT NULL,
    requested_end_datetime TIMESTAMP NOT NULL,
    confirmed_start_datetime TIMESTAMP,
    confirmed_end_datetime TIMESTAMP,
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'pending' CHECK (
        status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')
    ),
    
    -- Notes system
    client_notes TEXT, -- Client initial note to vendor
    vendor_notes TEXT, -- Vendor response to client message
    internal_notes TEXT, -- Private vendor notes
    
    -- Pricing
    price_quoted DECIMAL(10,2),
    price_final DECIMAL(10,2),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    -- Constraints
    CONSTRAINT valid_requested_times CHECK (requested_end_datetime > requested_start_datetime),
    CONSTRAINT valid_confirmed_times CHECK (
        confirmed_start_datetime IS NULL OR 
        confirmed_end_datetime IS NULL OR 
        confirmed_end_datetime > confirmed_start_datetime
    )
);

-- =========================================
-- HISTORY & ANALYTICS TABLES
-- =========================================

-- Schedule rules change history
CREATE TABLE schedule_rules_history (
    id SERIAL PRIMARY KEY,
    schedule_rule_id INTEGER NOT NULL,
    
    -- Change tracking
    action VARCHAR(20) NOT NULL CHECK (action IN ('created', 'updated', 'deleted')),
    changed_by INTEGER REFERENCES users(id),
    change_reason TEXT,
    
    -- Data snapshot
    rule_data JSONB NOT NULL,
    
    -- Timing
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Appointment change history
CREATE TABLE appointment_history (
    id SERIAL PRIMARY KEY,
    appointment_id INTEGER NOT NULL,
    
    -- Change tracking
    action VARCHAR(20) NOT NULL CHECK (
        action IN ('created', 'updated', 'confirmed', 'cancelled', 'completed', 'rescheduled')
    ),
    changed_by INTEGER REFERENCES users(id),
    change_reason TEXT,
    
    -- Field-level change tracking
    field_name VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    
    -- Full data snapshot for major changes
    appointment_data JSONB,
    
    -- Timing
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Availability snapshots for performance and analytics
CREATE TABLE availability_snapshots (
    id SERIAL PRIMARY KEY,
    storefront_id INTEGER NOT NULL REFERENCES storefronts(id),
    service_id INTEGER REFERENCES services(id), -- NULL = all services
    
    -- Snapshot data
    snapshot_date DATE NOT NULL,
    available_slots JSONB NOT NULL,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure one snapshot per storefront/service/date combination
    UNIQUE(storefront_id, service_id, snapshot_date)
);

-- =========================================
-- INDEXES FOR PERFORMANCE
-- =========================================

-- User indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role_active ON users(role, is_active) WHERE deleted_at IS NULL;

-- Storefront indexes
CREATE INDEX idx_storefronts_vendor ON storefronts(vendor_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_storefronts_active ON storefronts(is_active) WHERE deleted_at IS NULL;

-- Service indexes
CREATE INDEX idx_services_storefront ON services(storefront_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_services_active ON services(storefront_id, is_active) WHERE deleted_at IS NULL;

-- Schedule rule indexes (critical for availability calculations)
CREATE INDEX idx_schedule_rules_storefront ON schedule_rules(storefront_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_schedule_rules_service ON schedule_rules(service_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_schedule_rules_type_priority ON schedule_rules(storefront_id, rule_type, priority DESC) WHERE is_active = TRUE;
CREATE INDEX idx_schedule_rules_daily_lookup ON schedule_rules(storefront_id, service_id, specific_date) 
    WHERE rule_type = 'daily' AND is_active = TRUE;
CREATE INDEX idx_schedule_rules_weekly_lookup ON schedule_rules(storefront_id, service_id, day_of_week) 
    WHERE rule_type = 'weekly' AND is_active = TRUE;
CREATE INDEX idx_schedule_rules_monthly_lookup ON schedule_rules(storefront_id, service_id, month, year) 
    WHERE rule_type = 'monthly' AND is_active = TRUE;

-- Appointment slot indexes
CREATE INDEX idx_appointment_slots_storefront_service ON appointment_slots(storefront_id, service_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_appointment_slots_datetime ON appointment_slots(start_datetime, end_datetime) WHERE is_available = TRUE;
CREATE INDEX idx_appointment_slots_available ON appointment_slots(storefront_id, is_available) WHERE deleted_at IS NULL;

-- Appointment indexes (very important for performance)
CREATE INDEX idx_appointments_client ON appointments(client_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_appointments_storefront ON appointments(storefront_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_appointments_service ON appointments(service_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_appointments_status ON appointments(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_appointments_requested_datetime ON appointments(storefront_id, requested_start_datetime, requested_end_datetime) WHERE deleted_at IS NULL;
CREATE INDEX idx_appointments_confirmed_datetime ON appointments(storefront_id, confirmed_start_datetime, confirmed_end_datetime) 
    WHERE status IN ('confirmed', 'completed') AND deleted_at IS NULL;

-- History table indexes
CREATE INDEX idx_schedule_rules_history_rule_time ON schedule_rules_history(schedule_rule_id, changed_at DESC);
CREATE INDEX idx_appointment_history_appointment_time ON appointment_history(appointment_id, changed_at DESC);
CREATE INDEX idx_availability_snapshots_lookup ON availability_snapshots(storefront_id, service_id, snapshot_date DESC);

-- =========================================
-- TRIGGERS
-- =========================================

-- Updated_at triggers for automatic timestamp management
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_storefronts_updated_at 
    BEFORE UPDATE ON storefronts FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at 
    BEFORE UPDATE ON services FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedule_rules_updated_at 
    BEFORE UPDATE ON schedule_rules FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointment_slots_updated_at 
    BEFORE UPDATE ON appointment_slots FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at 
    BEFORE UPDATE ON appointments FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- History tracking triggers for audit trail
CREATE TRIGGER track_schedule_rule_changes_trigger
    AFTER INSERT OR UPDATE OR DELETE ON schedule_rules FOR EACH ROW
    EXECUTE FUNCTION track_schedule_rule_changes();

CREATE TRIGGER track_appointment_changes_trigger
    AFTER INSERT OR UPDATE ON appointments FOR EACH ROW
    EXECUTE FUNCTION track_appointment_changes();

-- Appointment slot booking count management trigger
CREATE TRIGGER update_slot_booking_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON appointments FOR EACH ROW
    EXECUTE FUNCTION update_slot_booking_count();