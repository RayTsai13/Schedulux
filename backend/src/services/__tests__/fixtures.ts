/**
 * Test fixtures for service-layer unit tests.
 * Each builder returns a complete row with sensible defaults; pass overrides for the fields under test.
 */
import type { ScheduleRule, Drop, Storefront, Service, Appointment } from '../../types';

const now = new Date('2026-01-01T00:00:00Z');

export function makeStorefront(overrides: Partial<Storefront> = {}): Storefront {
  return {
    id: 1,
    vendor_id: 100,
    name: 'Test Storefront',
    slug: 'test-storefront',
    timezone: 'UTC',
    is_active: true,
    theme_color: 'purple',
    instagram_handle: null,
    ...overrides,
  } as Storefront;
}

export function makeService(overrides: Partial<Service> = {}): Service {
  return {
    id: 7,
    storefront_id: 1,
    name: 'Haircut',
    duration_minutes: 60,
    buffer_time_minutes: 0,
    price: 40,
    is_active: true,
    ...overrides,
  } as Service;
}

let ruleId = 1;
export function makeRule(overrides: Partial<ScheduleRule> = {}): ScheduleRule {
  return {
    id: ruleId++,
    storefront_id: 1,
    service_id: null,
    rule_type: 'weekly',
    priority: 1,
    day_of_week: 1,
    specific_date: null,
    month: null,
    year: null,
    start_time: '09:00:00',
    end_time: '12:00:00',
    is_available: true,
    max_concurrent_appointments: 1,
    name: null,
    notes: null,
    is_active: true,
    created_at: now,
    updated_at: now,
    deleted_at: null,
    ...overrides,
  };
}

let dropId = 1;
export function makeDrop(overrides: Partial<Drop> = {}): Drop {
  return {
    id: dropId++,
    storefront_id: 1,
    service_id: null,
    title: 'Friday Night Drop',
    description: null,
    drop_date: '2026-06-08',
    start_time: '13:00:00',
    end_time: '15:00:00',
    max_concurrent_appointments: 1,
    is_published: true,
    is_active: true,
    created_at: now,
    updated_at: now,
    deleted_at: null,
    ...overrides,
  };
}

/** Minimal appointment row as returned by AppointmentModel.findActiveInRange */
export function makeBooking(startIso: string, endIso: string) {
  return {
    requested_start_datetime: new Date(startIso),
    requested_end_datetime: new Date(endIso),
  };
}

export function makeAppointment(overrides: Partial<Appointment> = {}): Appointment {
  return {
    id: 500,
    client_id: null,
    storefront_id: 1,
    guest_name: 'Sam Lee',
    guest_email: 'sam@example.com',
    guest_phone: null,
    manage_token: 'a'.repeat(64),
    service_id: 7,
    status: 'pending',
    requested_start_datetime: new Date('2026-06-08T09:00:00Z'),
    requested_end_datetime: new Date('2026-06-08T10:00:00Z'),
    ...overrides,
  } as Appointment;
}
