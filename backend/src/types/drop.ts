export interface Drop {
  id: number;
  storefront_id: number;
  service_id: number | null;
  title: string;
  description: string | null;
  drop_date: string; // YYYY-MM-DD
  start_time: string; // HH:MM:SS
  end_time: string; // HH:MM:SS
  max_concurrent_appointments: number;
  is_published: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface CreateDropRequest {
  service_id?: number | null;
  title: string;
  description?: string;
  drop_date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  max_concurrent_appointments?: number;
  is_published?: boolean;
}

export interface UpdateDropRequest {
  service_id?: number | null;
  title?: string;
  description?: string | null;
  drop_date?: string;
  start_time?: string;
  end_time?: string;
  max_concurrent_appointments?: number;
  is_published?: boolean;
  is_active?: boolean;
}
