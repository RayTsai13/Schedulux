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

/** Spot counts for a drop, computed from its window, capacity, and current bookings */
export interface DropSpots {
  /** Bookable spots in the whole window (slots × capacity) */
  total_spots: number;
  /** Spots still open right now */
  remaining_spots: number;
}

export type PublicDrop = Drop & DropSpots;

export type VendorDrop = Drop & DropSpots & { waitlist_count: number };

export interface DropWaitlistEntry {
  id: number;
  drop_id: number;
  name: string;
  email: string;
  created_at: Date;
  notified_at: Date | null;
}

/** Everything the public booking page needs in one response */
export interface PublicPage {
  storefront: import('./storefront').PublicStorefront;
  services: import('./service').Service[];
  drops: PublicDrop[];
}
