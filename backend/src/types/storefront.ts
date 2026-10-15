// Storefront-related types
// A storefront is a vendor's single public booking page, reachable at /@slug

export interface Storefront {
  id: number;
  vendor_id: number;
  name: string;
  /** Public handle: lowercase letters, digits, and dashes, 3–30 chars */
  slug: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  timezone: string;
  business_hours?: any; // JSONB
  is_active: boolean;
  avatar_url?: string;
  city?: string;
  state?: string;
  // Page styling
  theme_color: string;
  instagram_handle: string | null;
  // Timestamps
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface CreateStorefrontRequest {
  name: string;
  slug: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  timezone?: string;
  business_hours?: any;
  avatar_url?: string;
  city?: string;
  state?: string;
  theme_color?: string;
  instagram_handle?: string | null;
}

export type UpdateStorefrontRequest = Partial<CreateStorefrontRequest> & {
  is_active?: boolean;
};

/** Fields a vendor may change through the API */
export const UPDATABLE_STOREFRONT_FIELDS = [
  'name',
  'slug',
  'description',
  'address',
  'phone',
  'email',
  'timezone',
  'business_hours',
  'is_active',
  'avatar_url',
  'city',
  'state',
  'theme_color',
  'instagram_handle',
] as const;

export const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/;

/** Slugs that would collide with app routes */
export const RESERVED_SLUGS = new Set([
  'admin', 'api', 'app', 'book', 'dashboard', 'explore', 'forgot-password', 'help',
  'login', 'logout', 'manage', 'onboarding', 'playground', 'privacy', 'register',
  'reset-password', 'settings', 'signup', 'support', 'terms', 'cookies', 'www',
]);

/** Storefront fields safe to show on the public booking page */
export type PublicStorefront = Pick<
  Storefront,
  | 'id'
  | 'slug'
  | 'name'
  | 'description'
  | 'address'
  | 'city'
  | 'state'
  | 'timezone'
  | 'avatar_url'
  | 'theme_color'
  | 'instagram_handle'
>;
