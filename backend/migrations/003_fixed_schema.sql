--
-- PostgreSQL database dump
--

-- Dumped from database version 14.18 (Homebrew)
-- Dumped by pg_dump version 14.18 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: track_appointment_changes(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.track_appointment_changes() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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
$$;


--
-- Name: track_schedule_rule_changes(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.track_schedule_rule_changes() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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
$$;


--
-- Name: update_slot_booking_count(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_slot_booking_count() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: appointment_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.appointment_history (
    id integer NOT NULL,
    appointment_id integer NOT NULL,
    action character varying(20) NOT NULL,
    changed_by integer,
    change_reason text,
    field_name character varying(100),
    old_value text,
    new_value text,
    appointment_data jsonb,
    changed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT appointment_history_action_check CHECK (((action)::text = ANY ((ARRAY['created'::character varying, 'updated'::character varying, 'confirmed'::character varying, 'cancelled'::character varying, 'completed'::character varying, 'rescheduled'::character varying])::text[])))
);


--
-- Name: appointment_history_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.appointment_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: appointment_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.appointment_history_id_seq OWNED BY public.appointment_history.id;


--
-- Name: appointment_slots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.appointment_slots (
    id integer NOT NULL,
    storefront_id integer NOT NULL,
    service_id integer NOT NULL,
    start_datetime timestamp without time zone NOT NULL,
    end_datetime timestamp without time zone NOT NULL,
    max_bookings integer DEFAULT 1,
    current_bookings integer DEFAULT 0,
    is_available boolean DEFAULT true,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp without time zone,
    CONSTRAINT appointment_slots_current_bookings_check CHECK ((current_bookings >= 0)),
    CONSTRAINT appointment_slots_max_bookings_check CHECK ((max_bookings > 0)),
    CONSTRAINT valid_booking_count CHECK ((current_bookings <= max_bookings)),
    CONSTRAINT valid_slot_times CHECK ((end_datetime > start_datetime))
);


--
-- Name: appointment_slots_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.appointment_slots_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: appointment_slots_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.appointment_slots_id_seq OWNED BY public.appointment_slots.id;


--
-- Name: appointments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.appointments (
    id integer NOT NULL,
    client_id integer NOT NULL,
    storefront_id integer NOT NULL,
    service_id integer NOT NULL,
    slot_id integer,
    requested_start_datetime timestamp without time zone NOT NULL,
    requested_end_datetime timestamp without time zone NOT NULL,
    confirmed_start_datetime timestamp without time zone,
    confirmed_end_datetime timestamp without time zone,
    status character varying(20) DEFAULT 'pending'::character varying,
    client_notes text,
    vendor_notes text,
    internal_notes text,
    price_quoted numeric(10,2),
    price_final numeric(10,2),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp without time zone,
    CONSTRAINT appointments_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'confirmed'::character varying, 'cancelled'::character varying, 'completed'::character varying, 'no_show'::character varying])::text[]))),
    CONSTRAINT valid_confirmed_times CHECK (((confirmed_start_datetime IS NULL) OR (confirmed_end_datetime IS NULL) OR (confirmed_end_datetime > confirmed_start_datetime))),
    CONSTRAINT valid_requested_times CHECK ((requested_end_datetime > requested_start_datetime))
);


--
-- Name: appointments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.appointments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: appointments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.appointments_id_seq OWNED BY public.appointments.id;


--
-- Name: availability_snapshots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.availability_snapshots (
    id integer NOT NULL,
    storefront_id integer NOT NULL,
    service_id integer,
    snapshot_date date NOT NULL,
    available_slots jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: availability_snapshots_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.availability_snapshots_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: availability_snapshots_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.availability_snapshots_id_seq OWNED BY public.availability_snapshots.id;


--
-- Name: schedule_rules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schedule_rules (
    id integer NOT NULL,
    storefront_id integer NOT NULL,
    service_id integer,
    rule_type character varying(20) NOT NULL,
    priority integer DEFAULT 1 NOT NULL,
    day_of_week integer,
    specific_date date,
    month integer,
    year integer,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    is_available boolean DEFAULT true,
    max_concurrent_appointments integer DEFAULT 1,
    notes text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp without time zone,
    CONSTRAINT schedule_rules_day_of_week_check CHECK (((day_of_week >= 0) AND (day_of_week <= 6))),
    CONSTRAINT schedule_rules_max_concurrent_appointments_check CHECK ((max_concurrent_appointments > 0)),
    CONSTRAINT schedule_rules_month_check CHECK (((month >= 1) AND (month <= 12))),
    CONSTRAINT schedule_rules_priority_check CHECK ((priority > 0)),
    CONSTRAINT schedule_rules_rule_type_check CHECK (((rule_type)::text = ANY ((ARRAY['weekly'::character varying, 'daily'::character varying, 'monthly'::character varying])::text[]))),
    CONSTRAINT valid_rule_type_data CHECK (((((rule_type)::text = 'weekly'::text) AND (day_of_week IS NOT NULL) AND (specific_date IS NULL) AND (month IS NULL)) OR (((rule_type)::text = 'daily'::text) AND (specific_date IS NOT NULL) AND (day_of_week IS NULL) AND (month IS NULL)) OR (((rule_type)::text = 'monthly'::text) AND (month IS NOT NULL) AND (specific_date IS NULL) AND (day_of_week IS NULL)))),
    CONSTRAINT valid_time_range CHECK ((end_time > start_time))
);


--
-- Name: schedule_rules_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schedule_rules_history (
    id integer NOT NULL,
    schedule_rule_id integer NOT NULL,
    action character varying(20) NOT NULL,
    changed_by integer,
    change_reason text,
    rule_data jsonb NOT NULL,
    changed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT schedule_rules_history_action_check CHECK (((action)::text = ANY ((ARRAY['created'::character varying, 'updated'::character varying, 'deleted'::character varying])::text[])))
);


--
-- Name: schedule_rules_history_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.schedule_rules_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: schedule_rules_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.schedule_rules_history_id_seq OWNED BY public.schedule_rules_history.id;


--
-- Name: schedule_rules_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.schedule_rules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: schedule_rules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.schedule_rules_id_seq OWNED BY public.schedule_rules.id;


--
-- Name: services; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.services (
    id integer NOT NULL,
    storefront_id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    duration_minutes integer NOT NULL,
    buffer_time_minutes integer DEFAULT 0,
    price numeric(10,2),
    category character varying(100),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp without time zone,
    CONSTRAINT services_buffer_time_minutes_check CHECK ((buffer_time_minutes >= 0)),
    CONSTRAINT services_duration_minutes_check CHECK ((duration_minutes > 0))
);


--
-- Name: services_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.services_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: services_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.services_id_seq OWNED BY public.services.id;


--
-- Name: storefronts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.storefronts (
    id integer NOT NULL,
    vendor_id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    address text,
    phone character varying(20),
    email character varying(255),
    timezone character varying(50) DEFAULT 'UTC'::character varying,
    business_hours jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp without time zone
);


--
-- Name: storefronts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.storefronts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: storefronts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.storefronts_id_seq OWNED BY public.storefronts.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    phone character varying(20),
    role character varying(20) NOT NULL,
    timezone character varying(50) DEFAULT 'UTC'::character varying,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp without time zone,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['vendor'::character varying, 'client'::character varying, 'admin'::character varying])::text[])))
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: appointment_history id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointment_history ALTER COLUMN id SET DEFAULT nextval('public.appointment_history_id_seq'::regclass);


--
-- Name: appointment_slots id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointment_slots ALTER COLUMN id SET DEFAULT nextval('public.appointment_slots_id_seq'::regclass);


--
-- Name: appointments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments ALTER COLUMN id SET DEFAULT nextval('public.appointments_id_seq'::regclass);


--
-- Name: availability_snapshots id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.availability_snapshots ALTER COLUMN id SET DEFAULT nextval('public.availability_snapshots_id_seq'::regclass);


--
-- Name: schedule_rules id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_rules ALTER COLUMN id SET DEFAULT nextval('public.schedule_rules_id_seq'::regclass);


--
-- Name: schedule_rules_history id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_rules_history ALTER COLUMN id SET DEFAULT nextval('public.schedule_rules_history_id_seq'::regclass);


--
-- Name: services id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services ALTER COLUMN id SET DEFAULT nextval('public.services_id_seq'::regclass);


--
-- Name: storefronts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.storefronts ALTER COLUMN id SET DEFAULT nextval('public.storefronts_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: appointment_history appointment_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointment_history
    ADD CONSTRAINT appointment_history_pkey PRIMARY KEY (id);


--
-- Name: appointment_slots appointment_slots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointment_slots
    ADD CONSTRAINT appointment_slots_pkey PRIMARY KEY (id);


--
-- Name: appointments appointments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_pkey PRIMARY KEY (id);


--
-- Name: availability_snapshots availability_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.availability_snapshots
    ADD CONSTRAINT availability_snapshots_pkey PRIMARY KEY (id);


--
-- Name: availability_snapshots availability_snapshots_storefront_id_service_id_snapshot_da_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.availability_snapshots
    ADD CONSTRAINT availability_snapshots_storefront_id_service_id_snapshot_da_key UNIQUE (storefront_id, service_id, snapshot_date);


--
-- Name: schedule_rules_history schedule_rules_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_rules_history
    ADD CONSTRAINT schedule_rules_history_pkey PRIMARY KEY (id);


--
-- Name: schedule_rules schedule_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_rules
    ADD CONSTRAINT schedule_rules_pkey PRIMARY KEY (id);


--
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id);


--
-- Name: storefronts storefronts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.storefronts
    ADD CONSTRAINT storefronts_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_appointment_history_appointment_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointment_history_appointment_time ON public.appointment_history USING btree (appointment_id, changed_at DESC);


--
-- Name: idx_appointment_slots_available; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointment_slots_available ON public.appointment_slots USING btree (storefront_id, is_available) WHERE (deleted_at IS NULL);


--
-- Name: idx_appointment_slots_datetime; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointment_slots_datetime ON public.appointment_slots USING btree (start_datetime, end_datetime) WHERE (is_available = true);


--
-- Name: idx_appointment_slots_storefront_service; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointment_slots_storefront_service ON public.appointment_slots USING btree (storefront_id, service_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_appointments_client; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointments_client ON public.appointments USING btree (client_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_appointments_confirmed_datetime; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointments_confirmed_datetime ON public.appointments USING btree (storefront_id, confirmed_start_datetime, confirmed_end_datetime) WHERE (((status)::text = ANY ((ARRAY['confirmed'::character varying, 'completed'::character varying])::text[])) AND (deleted_at IS NULL));


--
-- Name: idx_appointments_requested_datetime; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointments_requested_datetime ON public.appointments USING btree (storefront_id, requested_start_datetime, requested_end_datetime) WHERE (deleted_at IS NULL);


--
-- Name: idx_appointments_service; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointments_service ON public.appointments USING btree (service_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_appointments_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointments_status ON public.appointments USING btree (status) WHERE (deleted_at IS NULL);


--
-- Name: idx_appointments_storefront; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointments_storefront ON public.appointments USING btree (storefront_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_availability_snapshots_lookup; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_availability_snapshots_lookup ON public.availability_snapshots USING btree (storefront_id, service_id, snapshot_date DESC);


--
-- Name: idx_schedule_rules_daily_lookup; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_schedule_rules_daily_lookup ON public.schedule_rules USING btree (storefront_id, service_id, specific_date) WHERE (((rule_type)::text = 'daily'::text) AND (is_active = true));


--
-- Name: idx_schedule_rules_history_rule_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_schedule_rules_history_rule_time ON public.schedule_rules_history USING btree (schedule_rule_id, changed_at DESC);


--
-- Name: idx_schedule_rules_monthly_lookup; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_schedule_rules_monthly_lookup ON public.schedule_rules USING btree (storefront_id, service_id, month, year) WHERE (((rule_type)::text = 'monthly'::text) AND (is_active = true));


--
-- Name: idx_schedule_rules_service; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_schedule_rules_service ON public.schedule_rules USING btree (service_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_schedule_rules_storefront; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_schedule_rules_storefront ON public.schedule_rules USING btree (storefront_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_schedule_rules_type_priority; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_schedule_rules_type_priority ON public.schedule_rules USING btree (storefront_id, rule_type, priority DESC) WHERE (is_active = true);


--
-- Name: idx_schedule_rules_weekly_lookup; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_schedule_rules_weekly_lookup ON public.schedule_rules USING btree (storefront_id, service_id, day_of_week) WHERE (((rule_type)::text = 'weekly'::text) AND (is_active = true));


--
-- Name: idx_services_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_services_active ON public.services USING btree (storefront_id, is_active) WHERE (deleted_at IS NULL);


--
-- Name: idx_services_storefront; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_services_storefront ON public.services USING btree (storefront_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_storefronts_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_storefronts_active ON public.storefronts USING btree (is_active) WHERE (deleted_at IS NULL);


--
-- Name: idx_storefronts_vendor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_storefronts_vendor ON public.storefronts USING btree (vendor_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_role_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_role_active ON public.users USING btree (role, is_active) WHERE (deleted_at IS NULL);


--
-- Name: appointments track_appointment_changes_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER track_appointment_changes_trigger AFTER INSERT OR UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.track_appointment_changes();


--
-- Name: schedule_rules track_schedule_rule_changes_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER track_schedule_rule_changes_trigger AFTER INSERT OR DELETE OR UPDATE ON public.schedule_rules FOR EACH ROW EXECUTE FUNCTION public.track_schedule_rule_changes();


--
-- Name: appointment_slots update_appointment_slots_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_appointment_slots_updated_at BEFORE UPDATE ON public.appointment_slots FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: appointments update_appointments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: schedule_rules update_schedule_rules_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_schedule_rules_updated_at BEFORE UPDATE ON public.schedule_rules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: services update_services_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: appointments update_slot_booking_count_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_slot_booking_count_trigger AFTER INSERT OR DELETE OR UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_slot_booking_count();


--
-- Name: storefronts update_storefronts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_storefronts_updated_at BEFORE UPDATE ON public.storefronts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: appointment_history appointment_history_changed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointment_history
    ADD CONSTRAINT appointment_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.users(id);


--
-- Name: appointment_slots appointment_slots_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointment_slots
    ADD CONSTRAINT appointment_slots_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id);


--
-- Name: appointment_slots appointment_slots_storefront_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointment_slots
    ADD CONSTRAINT appointment_slots_storefront_id_fkey FOREIGN KEY (storefront_id) REFERENCES public.storefronts(id);


--
-- Name: appointments appointments_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.users(id);


--
-- Name: appointments appointments_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id);


--
-- Name: appointments appointments_slot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_slot_id_fkey FOREIGN KEY (slot_id) REFERENCES public.appointment_slots(id);


--
-- Name: appointments appointments_storefront_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_storefront_id_fkey FOREIGN KEY (storefront_id) REFERENCES public.storefronts(id);


--
-- Name: availability_snapshots availability_snapshots_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.availability_snapshots
    ADD CONSTRAINT availability_snapshots_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id);


--
-- Name: availability_snapshots availability_snapshots_storefront_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.availability_snapshots
    ADD CONSTRAINT availability_snapshots_storefront_id_fkey FOREIGN KEY (storefront_id) REFERENCES public.storefronts(id);


--
-- Name: schedule_rules_history schedule_rules_history_changed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_rules_history
    ADD CONSTRAINT schedule_rules_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.users(id);


--
-- Name: schedule_rules schedule_rules_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_rules
    ADD CONSTRAINT schedule_rules_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id);


--
-- Name: schedule_rules schedule_rules_storefront_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_rules
    ADD CONSTRAINT schedule_rules_storefront_id_fkey FOREIGN KEY (storefront_id) REFERENCES public.storefronts(id);


--
-- Name: services services_storefront_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_storefront_id_fkey FOREIGN KEY (storefront_id) REFERENCES public.storefronts(id);


--
-- Name: storefronts storefronts_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.storefronts
    ADD CONSTRAINT storefronts_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

