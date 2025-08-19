// Storefront-related types
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
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface CreateStorefrontRequest {
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  timezone?: string;
  business_hours?: any;
}
