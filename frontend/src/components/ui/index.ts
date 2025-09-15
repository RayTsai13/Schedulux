// AppointmentCard - Simple appointment display for lists
export { default as AppointmentCard } from './AppointmentCard';

// AppointmentList - Container for multiple appointment cards
export { default as AppointmentList } from './AppointmentList';

// AppointmentDetailCard - Detailed view of a single appointment
export { default as AppointmentDetailCard } from './AppointmentDetailCard';

// StatusBadge - Reusable status indicator
export { default as StatusBadge } from './StatusBadge';

// Type definitions for appointments
export interface BaseAppointment {
  id: string;
  title: string;
  time: string;
  status: 'today' | 'tomorrow' | 'upcoming' | 'completed' | 'cancelled' | 'confirmed' | 'pending' | 'no-show';
  date?: string;
  client?: string;
  service?: string;
}

export interface DetailedAppointment extends BaseAppointment {
  client: string;
  service: string;
  date: string;
  duration: number;
  notes?: string;
  price?: number;
  location?: string;
  phone?: string;
  email?: string;
  rating?: number;
}

// Common event handlers
export interface AppointmentHandlers {
  onAppointmentClick?: (appointmentId: string) => void;
  onEdit?: (appointmentId: string) => void;
  onCancel?: (appointmentId: string) => void;
  onComplete?: (appointmentId: string) => void;
}
