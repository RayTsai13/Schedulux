// Appointment and scheduling-related types
// Note: ScheduleRule types are in schedule-rule.ts

// Appointment status type with approval workflow support
export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show' | 'declined';

export interface AppointmentSlot {
  id: number;
  storefront_id: number;
  service_id: number;
  start_datetime: Date;
  end_datetime: Date;
  max_bookings: number;
  current_bookings: number;
  is_available: boolean;
  notes?: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface Appointment {
  id: number;
  /** Legacy link to a client account; null for guest bookings */
  client_id: number | null;
  storefront_id: number;
  service_id: number;
  slot_id?: number;
  // Guest contact details (every booking has these)
  guest_name: string;
  guest_email: string;
  guest_phone?: string | null;
  /** Secret that lets the guest view, cancel, or reschedule without an account */
  manage_token: string;
  requested_start_datetime: Date;
  requested_end_datetime: Date;
  confirmed_start_datetime?: Date;
  confirmed_end_datetime?: Date;
  status: AppointmentStatus;
  client_notes?: string;
  vendor_notes?: string;
  internal_notes?: string;
  price_quoted?: number;
  price_final?: number;
  drop_id?: number | null;
  // Joined fields (from findByManageToken)
  service_name?: string;
  storefront_name?: string;
  storefront_slug?: string;
  storefront_timezone?: string;
  // Timestamps
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface GuestDetails {
  name: string;
  email: string;
  phone?: string;
}

/** Public view of a booking, returned to whoever holds the manage token */
export type ManagedAppointment = Pick<
  Appointment,
  | 'id'
  | 'storefront_id'
  | 'service_id'
  | 'status'
  | 'requested_start_datetime'
  | 'requested_end_datetime'
  | 'guest_name'
  | 'guest_email'
  | 'guest_phone'
  | 'client_notes'
  | 'vendor_notes'
  | 'price_quoted'
  | 'drop_id'
  | 'manage_token'
  | 'service_name'
  | 'storefront_name'
  | 'storefront_slug'
  | 'storefront_timezone'
>;
