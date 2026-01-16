// Appointment and scheduling-related types
// Note: ScheduleRule types are in schedule-rule.ts

// Appointment status type with approval workflow support
export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show' | 'declined';

// Service location type: where the appointment takes place
export type ServiceLocationType = 'at_vendor' | 'at_client';

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
  client_id: number;
  storefront_id: number;
  service_id: number;
  slot_id?: number;
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
  // Marketplace location fields
  service_location_type: ServiceLocationType;
  client_address?: string; // Required when service_location_type = 'at_client'
  // Timestamps
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface CreateAppointmentRequest {
  storefront_id: number;
  service_id: number;
  slot_id?: number;
  requested_start_datetime: string;
  requested_end_datetime: string;
  client_notes?: string;
  // Marketplace location fields
  service_location_type?: ServiceLocationType; // Default: 'at_vendor'
  client_address?: string; // Required when service_location_type = 'at_client'
}
