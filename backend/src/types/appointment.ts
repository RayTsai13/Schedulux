// Appointment and scheduling-related types
export interface ScheduleRule {
  id: number;
  storefront_id: number;
  service_id?: number;
  rule_type: 'weekly' | 'daily' | 'monthly';
  priority: number;
  day_of_week?: number;
  specific_date?: Date;
  month?: number;
  year?: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
  max_concurrent_appointments: number;
  notes?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

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
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  client_notes?: string;
  vendor_notes?: string;
  internal_notes?: string;
  price_quoted?: number;
  price_final?: number;
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
}
