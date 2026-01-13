// Service-related types
export interface Service {
  id: number;
  storefront_id: number;
  name: string;
  description?: string;
  duration_minutes: number;
  buffer_time_minutes: number; // DEFAULT 0 in schema, so always present
  price?: number; // numeric(10,2), can be NULL
  category?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface CreateServiceRequest {
  name: string;
  description?: string;
  duration_minutes: number;
  buffer_time_minutes?: number;
  price?: number;
  category?: string;
}

export interface UpdateServiceRequest {
  name?: string;
  description?: string;
  duration_minutes?: number;
  buffer_time_minutes?: number;
  price?: number;
  category?: string;
  is_active?: boolean;
}
