// Storefront-related types

// Profile type: individual vendors (tutors, freelancers) vs businesses (salons, clinics)
export type ProfileType = 'individual' | 'business';

// Location type: where services are provided
export type LocationType = 'fixed' | 'mobile' | 'hybrid';

export interface Storefront {
  id: number;
  vendor_id: number;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  timezone: string;
  business_hours?: any; // JSONB
  is_active: boolean;
  // Marketplace fields
  profile_type: ProfileType;
  location_type: LocationType;
  service_radius?: number; // Miles, only for mobile/hybrid
  service_area_city?: string; // For "Serves within X miles of [City]"
  avatar_url?: string;
  is_verified: boolean; // Admin-only, read-only for vendors
  // Timestamps
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface CreateStorefrontRequest {
  name: string;
  description?: string;
  address?: string; // Optional for mobile vendors
  phone?: string;
  email?: string;
  timezone?: string;
  business_hours?: any;
  // Marketplace fields (defaults applied by backend)
  profile_type?: ProfileType;
  location_type?: LocationType;
  service_radius?: number;
  service_area_city?: string;
  avatar_url?: string;
  // NOTE: is_verified is NOT included - admin-only
}

export interface UpdateStorefrontRequest {
  name?: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  timezone?: string;
  business_hours?: any;
  is_active?: boolean;
  // Marketplace fields
  profile_type?: ProfileType;
  location_type?: LocationType;
  service_radius?: number;
  service_area_city?: string;
  avatar_url?: string;
  // NOTE: is_verified is NOT included - admin-only
}
