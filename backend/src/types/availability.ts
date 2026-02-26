/**
 * Availability Type Definitions
 *
 * Types for the availability calculation engine and booking system.
 */

/**
 * A single available time slot for booking
 */
export interface AvailableSlot {
  /** Start datetime in ISO 8601 UTC format */
  start_datetime: string;
  /** End datetime in ISO 8601 UTC format */
  end_datetime: string;
  /** Date in storefront timezone (YYYY-MM-DD) */
  local_date: string;
  /** Start time in storefront timezone (HH:MM) */
  local_start_time: string;
  /** End time in storefront timezone (HH:MM) */
  local_end_time: string;
  /** Remaining booking capacity (max_concurrent - current_bookings) */
  available_capacity: number;
}

/**
 * Response structure for availability endpoint
 */
export interface AvailabilityResponse {
  storefront_id: number;
  service_id: number;
  timezone: string;
  service: {
    name: string;
    duration_minutes: number;
    buffer_time_minutes: number;
    price: number | null;
  };
  slots: AvailableSlot[];
}

/**
 * Internal representation of a time block during availability calculation
 */
export interface TimeBlock {
  /** Start time as Date object */
  start: Date;
  /** End time as Date object */
  end: Date;
  /** Whether this block allows bookings */
  isAvailable: boolean;
  /** Maximum concurrent appointments allowed */
  maxConcurrent: number;
  /** Rule priority (higher wins in conflicts) */
  priority: number;
  /** Original rule ID for debugging */
  ruleId?: number;
  /** Drop ID if this block came from a drop */
  dropId?: number;
}

/**
 * Availability check result for a specific slot
 */
export interface SlotAvailabilityResult {
  available: boolean;
  reason?: string;
  currentBookings?: number;
  maxConcurrent?: number;
}

/**
 * Query options for fetching appointments
 */
export interface AppointmentQueryOptions {
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  startDate?: Date;
  endDate?: Date;
  upcoming?: boolean;
}
