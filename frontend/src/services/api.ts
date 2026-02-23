import axios, { AxiosInstance, AxiosResponse } from 'axios';

// ================================================================
// BASE API CONFIGURATION
// ================================================================

// Base URL for all API requests - points to your Express.js backend server
// This is automatically prepended to all relative URLs in API calls
const API_BASE_URL = 'http://localhost:3000/api';

// Create a configured axios instance that will be used for all HTTP requests
// This centralizes configuration and allows us to add interceptors
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,           // All requests will start with this URL
  headers: {
    'Content-Type': 'application/json',  // Tell server we're sending JSON data
  },
  timeout: 10000,                  // Cancel request if it takes longer than 10 seconds
});

// ================================================================
// REQUEST INTERCEPTOR - AUTOMATIC AUTHENTICATION
// ================================================================

// This interceptor runs BEFORE every HTTP request is sent
// It automatically adds authentication headers to all requests
apiClient.interceptors.request.use(
  (config) => {
    // Retrieve the stored JWT token from browser's localStorage
    // This token was saved when user successfully logged in
    const token = localStorage.getItem('auth_token');
    
    if (token) {
      // If token exists, add it to the Authorization header
      // Backend will receive: "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
      // This proves the user is authenticated for protected routes
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Return the modified config so the request can proceed
    return config;
  },
  (error) => {
    // If there's an error in the request setup phase, reject the promise
    // This handles issues like network problems before request is sent
    return Promise.reject(error);
  }
);

// ================================================================
// RESPONSE INTERCEPTOR - AUTOMATIC ERROR HANDLING
// ================================================================

// This interceptor runs AFTER every HTTP response is received
// It provides centralized error handling, especially for authentication issues
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // If response is successful (status 200-299), just return it unchanged
    // The calling code will receive the response data normally
    return response;
  },
  (error) => {
    // Handle error responses (status 400-599)
    
    // Check if the error is a 401 Unauthorized response
    // This typically means the user's token has expired or is invalid
    if (error.response?.status === 401) {
      // Unauthorized - user's session has expired or token is invalid
      
      // Clear all stored authentication data from browser storage
      localStorage.removeItem('auth_token');    // Remove JWT token
      localStorage.removeItem('user_data');     // Remove cached user info
      
      // Forcefully redirect user to login page
      // This ensures they can't access protected content
      window.location.href = '/login';
    }
    
    // For all other errors, pass them through to the calling code
    // The calling code can then handle specific error cases
    return Promise.reject(error);
  }
);

// ================================================================
// TYPE DEFINITIONS - API RESPONSE CONTRACTS
// ================================================================

// Standard API response structure that your backend returns
// This ensures type safety and consistent error handling
export interface ApiResponse<T> {
  success: boolean;    // Indicates if the operation was successful
  data?: T;           // Contains the actual response data (only present on success)
  error?: string;     // Brief error identifier (only present on failure)  
  message?: string;   // Human-readable error/success message
}

// User data structure as returned by the backend
// This matches your backend User model/type
export interface User {
  id: number;           // Unique user identifier from database
  email: string;        // User's email address (used for login)
  first_name: string;   // User's first name
  last_name: string;    // User's last name
  role: 'vendor' | 'client';  // User type: service provider or customer
  phone?: string;       // Optional phone number
  timezone?: string;    // User's timezone for appointment scheduling
  created_at: string;   // When the user account was created (ISO string)
  updated_at: string;   // When the user account was last modified (ISO string)
}

// Data structure for login requests sent to backend
export interface LoginRequest {
  email: string;        // User's email address
  password: string;     // User's password (plain text, will be hashed by backend)
}

// Data structure for user registration requests sent to backend
export interface RegisterRequest {
  email: string;        // Must be unique and valid email format
  password: string;     // Must meet password strength requirements
  first_name: string;   // Required field
  last_name: string;    // Required field
  role: 'vendor' | 'client';  // Must specify user type
  phone?: string;       // Optional contact number
  timezone?: string;    // Optional timezone (auto-detected if not provided)
}

// Response structure for successful authentication (login/register)
// Contains both user data and JWT token for future requests
export interface AuthResponse {
  user: User;          // Complete user profile data
  token: string;       // JWT token for authenticating future requests
}

// ================================================================
// AUTHENTICATION API FUNCTIONS
// ================================================================

// Collection of functions for user authentication and account management
// These functions handle communication with your backend auth endpoints
export const authApi = {
  
  // ================================================================
  // USER REGISTRATION
  // ================================================================
  
  /**
   * Registers a new user account
   * 
   * HTTP Request Flow:
   * POST /api/auth/register
   * Body: { email, password, first_name, last_name, role, phone?, timezone? }
   * 
   * Backend Processing:
   * 1. Validates input data (email format, password strength, etc.)
   * 2. Checks if email already exists in database
   * 3. Hashes the password using bcrypt
   * 4. Creates new user record in database
   * 5. Generates JWT token for the new user
   * 6. Returns user data + token
   * 
   * Frontend Processing:
   * 1. Sends HTTP request with user data
   * 2. If successful, stores token and user data in localStorage
   * 3. Returns structured response to calling component
   * 
   * @param userData - User registration information
   * @returns Promise<ApiResponse<AuthResponse>> - Contains user data and auth token
   */
  register: async (userData: RegisterRequest): Promise<ApiResponse<AuthResponse>> => {
    try {
      // Send POST request to registration endpoint
      // Axios automatically converts userData object to JSON
      const response = await apiClient.post('/auth/register', userData);
      
      // If registration successful, store authentication data locally
      if (response.data.success && response.data.data) {
        // Store JWT token for future authenticated requests
        // This token proves the user is logged in
        localStorage.setItem('auth_token', response.data.data.token);
        
        // Cache user profile data to avoid repeated API calls
        // This allows immediate access to user info without server requests
        localStorage.setItem('user_data', JSON.stringify(response.data.data.user));
      }
      
      // Return the backend response to the calling component
      return response.data;
      
    } catch (error: any) {
      // Handle network errors and HTTP error responses
      
      if (error.response?.data) {
        // Backend returned an error response (400, 422, 500, etc.)
        // Return the error message from backend
        return error.response.data;
      }
      
      // Network error (no internet, server down, etc.)
      // Return a user-friendly error message
      return {
        success: false,
        error: 'Network error',
        message: 'Unable to connect to server. Please try again.',
      };
    }
  },

  // ================================================================
  // USER LOGIN
  // ================================================================
  
  /**
   * Authenticates existing user with email and password
   * 
   * HTTP Request Flow:
   * POST /api/auth/login
   * Body: { email, password }
   * 
   * Backend Processing:
   * 1. Finds user by email in database
   * 2. Compares provided password with hashed password using bcrypt
   * 3. If passwords match, generates JWT token
   * 4. Returns user data + token
   * 
   * Frontend Processing:
   * 1. Sends credentials to backend
   * 2. If successful, stores token and user data
   * 3. User is now authenticated for protected routes
   * 
   * @param credentials - User's email and password
   * @returns Promise<ApiResponse<AuthResponse>> - Contains user data and auth token
   */
  login: async (credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> => {
    try {
      // Send POST request to login endpoint
      const response = await apiClient.post('/auth/login', credentials);
      
      // If login successful, store authentication data locally
      if (response.data.success && response.data.data) {
        // Store JWT token - this will be automatically added to future requests
        // by the request interceptor we configured above
        localStorage.setItem('auth_token', response.data.data.token);
        
        // Cache user profile data for immediate access
        localStorage.setItem('user_data', JSON.stringify(response.data.data.user));
      }
      
      return response.data;
      
    } catch (error: any) {
      // Handle authentication errors (wrong password, user not found, etc.)
      
      if (error.response?.data) {
        // Backend returned specific error (invalid credentials, account locked, etc.)
        return error.response.data;
      }
      
      // Network or server error
      return {
        success: false,
        error: 'Network error',
        message: 'Unable to connect to server. Please try again.',
      };
    }
  },

  // ================================================================
  // GET CURRENT USER PROFILE
  // ================================================================
  
  /**
   * Fetches current user's profile data from backend
   * This is used to verify the user's token is still valid
   * and to refresh user data if needed
   * 
   * HTTP Request Flow:
   * GET /api/auth/me
   * Headers: { Authorization: "Bearer <token>" }
   * 
   * Backend Processing:
   * 1. Extracts JWT token from Authorization header
   * 2. Verifies token signature and expiration
   * 3. Decodes user ID from token payload
   * 4. Fetches current user data from database
   * 5. Returns user profile
   * 
   * Frontend Usage:
   * - Called when app starts to verify stored token is still valid
   * - Called to refresh user data after profile updates
   * - If this fails with 401, user will be automatically logged out
   * 
   * @returns Promise<ApiResponse<User>> - Current user's profile data
   */
  me: async (): Promise<ApiResponse<User>> => {
    try {
      // Send GET request to /me endpoint
      // Authorization header is automatically added by request interceptor
      const response = await apiClient.get('/auth/me');
      return response.data;
      
    } catch (error: any) {
      // Handle token validation errors
      
      if (error.response?.data) {
        // Backend returned error (token expired, invalid, user not found, etc.)
        return error.response.data;
      }
      
      // Network error
      return {
        success: false,
        error: 'Network error',
        message: 'Unable to fetch user profile.',
      };
    }
  },

  // ================================================================
  // USER LOGOUT
  // ================================================================
  
  /**
   * Logs out the current user by clearing all stored authentication data
   * 
   * Process:
   * 1. Removes JWT token from localStorage
   * 2. Removes cached user data from localStorage
   * 3. Redirects to login page
   * 
   * Note: This is a client-side logout only. The JWT token itself
   * cannot be invalidated on the server (stateless design), but removing
   * it from the client prevents further authenticated requests.
   * 
   * For additional security, you could:
   * - Maintain a blacklist of tokens on the server
   * - Use short-lived tokens with refresh token mechanism
   * - Send logout request to server to log the action
   */
  logout: (): void => {
    // Clear all authentication data from browser storage
    localStorage.removeItem('auth_token');    // Remove JWT token
    localStorage.removeItem('user_data');     // Remove cached user profile
    
    // Redirect to login page
    // This ensures user can't access protected content
    window.location.href = '/login';
  },

  // ================================================================
  // UTILITY FUNCTIONS FOR CLIENT-SIDE AUTH STATE
  // ================================================================
  
  /**
   * Checks if user is currently authenticated (has valid token stored)
   * 
   * This is a simple client-side check that only verifies a token exists.
   * It does NOT verify the token is valid or hasn't expired.
   * For server-side verification, use the me() function.
   * 
   * Usage: Quick check for showing/hiding UI elements
   * 
   * @returns boolean - True if auth token exists in localStorage
   */
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('auth_token');
    return !!token;  // Convert to boolean (null/undefined becomes false)
  },

  /**
   * Retrieves cached user data from localStorage
   * 
   * This returns the user profile that was stored during login/registration.
   * The data might be stale if the user's profile was updated on another device.
   * 
   * For fresh data, use the me() function to fetch from server.
   * 
   * @returns User | null - Parsed user object or null if not found/invalid
   */
  getCurrentUser: (): User | null => {
    const userData = localStorage.getItem('user_data');
    
    if (userData) {
      try {
        // Parse JSON string back into User object
        return JSON.parse(userData);
      } catch {
        // If JSON parsing fails (corrupted data), return null
        // This prevents app crashes from invalid stored data
        return null;
      }
    }
    
    return null;  // No user data stored
  },

  /**
   * Retrieves the stored JWT authentication token
   * 
   * This token is used for authenticating requests to protected endpoints.
   * The request interceptor automatically adds this to request headers.
   * 
   * @returns string | null - JWT token or null if not stored
   */
  getToken: (): string | null => {
    return localStorage.getItem('auth_token');
  },
};

// ================================================================
// GENERAL API FUNCTIONS
// ================================================================

// Collection of non-authentication related API functions
// These are utility endpoints for app status and information
export const api = {
  
  /**
   * Health check endpoint to verify backend server is running
   * 
   * HTTP Request Flow:
   * GET /api/health
   * 
   * Backend Response:
   * Typically returns server status, uptime, database connectivity, etc.
   * 
   * Frontend Usage:
   * - Check if backend is reachable before making other requests
   * - Monitor application health in admin dashboards
   * - Debugging connection issues
   * 
   * @returns Promise<any> - Server health information
   */
  health: async (): Promise<any> => {
    try {
      const response = await apiClient.get('/health');
      return response.data;
    } catch (error) {
      // Re-throw error so calling code can handle connection failures
      throw error;
    }
  },

  /**
   * API information endpoint
   * 
   * HTTP Request Flow:
   * GET /api/
   * 
   * Backend Response:
   * Typically returns API version, available endpoints, documentation links, etc.
   * 
   * Frontend Usage:
   * - Display API version in admin interfaces
   * - Feature detection (check what endpoints are available)
   * - Development and debugging
   * 
   * @returns Promise<any> - API information and metadata
   */
  info: async (): Promise<any> => {
    try {
      const response = await apiClient.get('/');
      return response.data;
    } catch (error) {
      // Re-throw error for calling code to handle
      throw error;
    }
  },
};

// ================================================================
// STOREFRONT API FUNCTIONS
// ================================================================

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
  business_hours?: BusinessHours;
  is_active: boolean;
  // Marketplace fields
  profile_type: ProfileType;
  location_type: LocationType;
  service_radius?: number; // Miles, only for mobile/hybrid
  service_area_city?: string; // For "Serves within X miles of [City]"
  avatar_url?: string;
  is_verified: boolean; // Admin-only, read-only for vendors
  // Geolocation fields
  latitude?: number;
  longitude?: number;
  city?: string;
  state?: string;
  // Visual portfolio fields
  layout_mode: string;
  theme_color: string;
  instagram_handle: string | null;
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface BusinessHours {
  [day: string]: {
    isOpen: boolean;
    periods: Array<{
      start: string; // "09:00"
      end: string;   // "17:00"
    }>;
  };
}

export interface CreateStorefrontRequest {
  name: string;
  description?: string;
  address?: string; // Optional for mobile vendors
  phone?: string;
  email?: string;
  timezone?: string;
  business_hours?: BusinessHours;
  // Marketplace fields (defaults applied by backend)
  profile_type?: ProfileType;
  location_type?: LocationType;
  service_radius?: number;
  service_area_city?: string;
  avatar_url?: string;
  // Geolocation fields
  latitude?: number;
  longitude?: number;
  city?: string;
  state?: string;
  // Visual portfolio fields
  layout_mode?: string;
  theme_color?: string;
  instagram_handle?: string;
  // NOTE: is_verified is NOT included - admin-only
}

export interface UpdateStorefrontRequest extends Partial<CreateStorefrontRequest> {
  is_active?: boolean;
}

export const storefrontApi = {
  /**
   * Get all storefronts for the current vendor
   */
  getAll: async (): Promise<ApiResponse<Storefront[]>> => {
    try {
      const response = await apiClient.get('/storefronts');
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: 'Network error',
        message: 'Unable to fetch storefronts.',
      };
    }
  },

  /**
   * Get a single storefront by ID
   */
  getById: async (id: number): Promise<ApiResponse<Storefront>> => {
    try {
      const response = await apiClient.get(`/storefronts/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: 'Network error',
        message: 'Unable to fetch storefront.',
      };
    }
  },

  /**
   * Create a new storefront
   */
  create: async (data: CreateStorefrontRequest): Promise<ApiResponse<Storefront>> => {
    try {
      const response = await apiClient.post('/storefronts', data);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: 'Network error',
        message: 'Unable to create storefront.',
      };
    }
  },

  /**
   * Update an existing storefront
   */
  update: async (
    id: number,
    data: UpdateStorefrontRequest
  ): Promise<ApiResponse<Storefront>> => {
    try {
      const response = await apiClient.put(`/storefronts/${id}`, data);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: 'Network error',
        message: 'Unable to update storefront.',
      };
    }
  },

  /**
   * Delete a storefront (soft delete)
   */
  delete: async (id: number): Promise<ApiResponse<void>> => {
    try {
      const response = await apiClient.delete(`/storefronts/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: 'Network error',
        message: 'Unable to delete storefront.',
      };
    }
  },
};

// ================================================================
// SERVICE API FUNCTIONS
// ================================================================

// Service-related types (matches backend exactly)
export interface Service {
  id: number;
  storefront_id: number;
  name: string;
  description?: string;
  duration_minutes: number;
  buffer_time_minutes: number;
  price?: number;
  category?: string;
  is_active: boolean;
  image_url: string | null;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface CreateServiceRequest {
  name: string;
  description?: string;
  duration_minutes: number;
  buffer_time_minutes?: number;
  price?: number;
  category?: string;
  image_url?: string;
  is_featured?: boolean;
}

export interface UpdateServiceRequest {
  name?: string;
  description?: string;
  duration_minutes?: number;
  buffer_time_minutes?: number;
  price?: number;
  category?: string;
  is_active?: boolean;
  image_url?: string | null;
  is_featured?: boolean;
}

export const serviceApi = {
  /**
   * Get all active services for a storefront (public)
   */
  getByStorefront: async (storefrontId: number): Promise<ApiResponse<Service[]>> => {
    try {
      const response = await apiClient.get(`/storefronts/${storefrontId}/services`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: 'Network error',
        message: 'Unable to fetch services.',
      };
    }
  },

  /**
   * Get all services including inactive (vendor only)
   */
  getAllByStorefront: async (storefrontId: number): Promise<ApiResponse<Service[]>> => {
    try {
      const response = await apiClient.get(`/storefronts/${storefrontId}/services/all`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: 'Network error',
        message: 'Unable to fetch services.',
      };
    }
  },

  /**
   * Get a single service by ID
   */
  getById: async (id: number): Promise<ApiResponse<Service>> => {
    try {
      const response = await apiClient.get(`/services/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: 'Network error',
        message: 'Unable to fetch service.',
      };
    }
  },

  /**
   * Create a new service
   */
  create: async (storefrontId: number, data: CreateServiceRequest): Promise<ApiResponse<Service>> => {
    try {
      const response = await apiClient.post(`/storefronts/${storefrontId}/services`, data);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: 'Network error',
        message: 'Unable to create service.',
      };
    }
  },

  /**
   * Update a service
   */
  update: async (id: number, data: UpdateServiceRequest): Promise<ApiResponse<Service>> => {
    try {
      const response = await apiClient.put(`/services/${id}`, data);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: 'Network error',
        message: 'Unable to update service.',
      };
    }
  },

  /**
   * Delete a service (soft delete)
   */
  delete: async (id: number): Promise<ApiResponse<void>> => {
    try {
      const response = await apiClient.delete(`/services/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: 'Network error',
        message: 'Unable to delete service.',
      };
    }
  },
};

// ================================================================
// SCHEDULE RULE API FUNCTIONS
// ================================================================

// Schedule rule types (matches backend exactly)
export type RuleType = 'weekly' | 'daily' | 'monthly';

export interface ScheduleRule {
  id: number;
  storefront_id: number;
  service_id: number | null;
  rule_type: RuleType;
  priority: number;
  day_of_week: number | null;
  specific_date: string | null;
  month: number | null;
  year: number | null;
  start_time: string;
  end_time: string;
  is_available: boolean;
  max_concurrent_appointments: number;
  name: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CreateScheduleRuleRequest {
  service_id?: number | null;
  rule_type: RuleType;
  priority?: number;
  day_of_week?: number;
  specific_date?: string;
  month?: number;
  year?: number;
  start_time: string;
  end_time: string;
  is_available?: boolean;
  max_concurrent_appointments?: number;
  name?: string;
  notes?: string;
}

export interface UpdateScheduleRuleRequest {
  service_id?: number | null;
  rule_type?: RuleType;
  priority?: number;
  day_of_week?: number | null;
  specific_date?: string | null;
  month?: number | null;
  year?: number | null;
  start_time?: string;
  end_time?: string;
  is_available?: boolean;
  max_concurrent_appointments?: number;
  name?: string | null;
  notes?: string | null;
  is_active?: boolean;
}

export const scheduleRuleApi = {
  /**
   * Get all active schedule rules for a storefront (public)
   */
  getByStorefront: async (storefrontId: number): Promise<ApiResponse<ScheduleRule[]>> => {
    try {
      const response = await apiClient.get(`/storefronts/${storefrontId}/rules`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: 'Network error',
        message: 'Unable to fetch schedule rules.',
      };
    }
  },

  /**
   * Get all schedule rules including inactive (vendor only)
   */
  getAllByStorefront: async (storefrontId: number): Promise<ApiResponse<ScheduleRule[]>> => {
    try {
      const response = await apiClient.get(`/storefronts/${storefrontId}/rules/all`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: 'Network error',
        message: 'Unable to fetch schedule rules.',
      };
    }
  },

  /**
   * Get a single schedule rule by ID
   */
  getById: async (id: number): Promise<ApiResponse<ScheduleRule>> => {
    try {
      const response = await apiClient.get(`/rules/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: 'Network error',
        message: 'Unable to fetch schedule rule.',
      };
    }
  },

  /**
   * Create a new schedule rule
   */
  create: async (storefrontId: number, data: CreateScheduleRuleRequest): Promise<ApiResponse<ScheduleRule>> => {
    try {
      const response = await apiClient.post(`/storefronts/${storefrontId}/rules`, data);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: 'Network error',
        message: 'Unable to create schedule rule.',
      };
    }
  },

  /**
   * Update a schedule rule
   */
  update: async (id: number, data: UpdateScheduleRuleRequest): Promise<ApiResponse<ScheduleRule>> => {
    try {
      const response = await apiClient.put(`/rules/${id}`, data);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: 'Network error',
        message: 'Unable to update schedule rule.',
      };
    }
  },

  /**
   * Delete a schedule rule (soft delete)
   */
  delete: async (id: number): Promise<ApiResponse<void>> => {
    try {
      const response = await apiClient.delete(`/rules/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: 'Network error',
        message: 'Unable to delete schedule rule.',
      };
    }
  },
};

// ================================================================
// APPOINTMENT API FUNCTIONS
// ================================================================

// Appointment-related types (matches backend exactly)
export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show' | 'declined';

// Service location type: where the appointment takes place
export type ServiceLocationType = 'at_vendor' | 'at_client';

export interface Appointment {
  id: number;
  client_id: number;
  storefront_id: number;
  service_id: number;
  slot_id?: number | null;
  requested_start_datetime: string;
  requested_end_datetime: string;
  confirmed_start_datetime?: string | null;
  confirmed_end_datetime?: string | null;
  status: AppointmentStatus;
  client_notes?: string | null;
  vendor_notes?: string | null;
  internal_notes?: string | null;
  price_quoted?: number | null;
  price_final?: number | null;
  // Marketplace location fields
  service_location_type: ServiceLocationType;
  client_address?: string | null; // Required when service_location_type = 'at_client'
  // Timestamps
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface UpdateAppointmentStatusRequest {
  status: AppointmentStatus;
  vendor_notes?: string;
  internal_notes?: string;
}

export const appointmentApi = {
  /**
   * Get appointments for a storefront (vendor only)
   * Supports filtering by status and date range
   */
  getByStorefront: async (
    storefrontId: number,
    params?: { status?: string; start_date?: string; end_date?: string }
  ): Promise<ApiResponse<Appointment[]>> => {
    try {
      const response = await apiClient.get(`/storefronts/${storefrontId}/appointments`, { params });
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: 'Network error',
        message: 'Unable to fetch appointments.',
      };
    }
  },

  /**
   * Get appointments for the current client
   */
  getClientAppointments: async (
    params?: { status?: string; upcoming?: boolean }
  ): Promise<ApiResponse<Appointment[]>> => {
    try {
      const response = await apiClient.get('/appointments', { params });
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: 'Network error',
        message: 'Unable to fetch appointments.',
      };
    }
  },

  /**
   * Get a single appointment by ID
   */
  getById: async (id: number): Promise<ApiResponse<Appointment>> => {
    try {
      const response = await apiClient.get(`/appointments/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: 'Network error',
        message: 'Unable to fetch appointment.',
      };
    }
  },

  /**
   * Update appointment status (vendor: confirm, cancel, complete, no_show; client: cancel only)
   */
  updateStatus: async (
    id: number,
    data: UpdateAppointmentStatusRequest
  ): Promise<ApiResponse<Appointment>> => {
    try {
      const response = await apiClient.patch(`/appointments/${id}/status`, data);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: 'Network error',
        message: 'Unable to update appointment.',
      };
    }
  },

  /**
   * Cancel an appointment (convenience method)
   */
  cancel: async (id: number, reason?: string): Promise<ApiResponse<Appointment>> => {
    return appointmentApi.updateStatus(id, {
      status: 'cancelled',
      internal_notes: reason,
    });
  },

  /**
   * Confirm an appointment (vendor only)
   */
  confirm: async (id: number, vendorNotes?: string): Promise<ApiResponse<Appointment>> => {
    return appointmentApi.updateStatus(id, {
      status: 'confirmed',
      vendor_notes: vendorNotes,
    });
  },

  /**
   * Complete an appointment (vendor only)
   */
  complete: async (id: number, internalNotes?: string): Promise<ApiResponse<Appointment>> => {
    return appointmentApi.updateStatus(id, {
      status: 'completed',
      internal_notes: internalNotes,
    });
  },
};

// ================================================================
// AVAILABILITY API FUNCTIONS (PUBLIC - No auth required)
// ================================================================

export interface AvailableSlot {
  start_datetime: string;
  end_datetime: string;
  local_date: string;
  local_start_time: string;
  local_end_time: string;
  available_capacity: number;
}

export interface AvailabilityResponse {
  storefront_id: number;
  service_id: number;
  timezone: string;
  service: {
    name: string;
    duration_minutes: number;
    buffer_time_minutes: number;
    price: number | null;
  };
  slots: AvailableSlot[];
}

export interface CreateAppointmentRequest {
  storefront_id: number;
  service_id: number;
  start_datetime: string;
  client_notes?: string;
  // Marketplace location fields
  service_location_type?: ServiceLocationType; // Default: 'at_vendor'
  client_address?: string; // Required when service_location_type = 'at_client'
}

export const availabilityApi = {
  /**
   * Get available appointment slots for a service (PUBLIC endpoint)
   */
  getSlots: async (
    storefrontId: number,
    params: { service_id: number; start_date: string; end_date: string }
  ): Promise<ApiResponse<AvailabilityResponse>> => {
    try {
      const response = await apiClient.get(`/storefronts/${storefrontId}/availability`, { params });
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: ApiResponse<AvailabilityResponse> } };
      if (axiosError.response?.data) {
        return axiosError.response.data;
      }
      return {
        success: false,
        error: 'Network error',
        message: 'Unable to fetch availability.',
      };
    }
  },
};

// Add createAppointment to appointmentApi
export const bookingApi = {
  /**
   * Create/book a new appointment
   */
  create: async (data: CreateAppointmentRequest): Promise<ApiResponse<Appointment>> => {
    try {
      const response = await apiClient.post('/appointments', data);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: ApiResponse<Appointment> } };
      if (axiosError.response?.data) {
        return axiosError.response.data;
      }
      return {
        success: false,
        error: 'Network error',
        message: 'Unable to book appointment.',
      };
    }
  },
};

// ================================================================
// MARKETPLACE API (Public endpoints - no authentication required)
// ================================================================

export interface PublicStorefrontDetail {
  storefront: {
    id: number;
    name: string;
    description?: string;
    avatar_url?: string;
    profile_type: string;
    location_type: string;
    is_verified: boolean;
    city?: string;
    state?: string;
    address?: string;
    service_radius?: number;
    service_area_city?: string;
    instagram_handle?: string;
    price_range?: {
      min: number;
      max: number;
      currency: string;
    };
    service_count: string;
    service_categories: string[];
  };
  services: Array<{
    id: number;
    name: string;
    description?: string;
    duration: number;
    price: number;
    image_url?: string;
  }>;
}

export const marketplaceApi = {
  /**
   * Get public storefront details by ID (no auth required)
   */
  getStorefront: async (id: number): Promise<ApiResponse<PublicStorefrontDetail>> => {
    try {
      const response = await apiClient.get(`/marketplace/storefronts/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: 'Network error',
        message: 'Unable to fetch storefront.',
      };
    }
  },

  search: async (params: MarketplaceSearchParams): Promise<ApiResponse<MarketplaceSearchResponse>> => {
    try {
      const response = await apiClient.get('/marketplace/search', { params });
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: 'Network error',
        message: 'Unable to search storefronts.',
      };
    }
  },
};

// ================================================================
// MARKETPLACE SEARCH TYPES
// ================================================================

export interface MarketplaceStorefront {
  id: number;
  name: string;
  description?: string;
  avatar_url?: string;
  profile_type: 'individual' | 'business';
  location_type: 'fixed' | 'mobile' | 'hybrid';
  is_verified: boolean;
  city?: string;
  state?: string;
  address?: string;
  service_radius?: number;
  service_area_city?: string;
  service_count: number;
  price_range?: { min: number; max: number };
  service_categories: string[];
  distance_miles?: number; // Only present if lat/long used
}

export interface MarketplaceSearchParams {
  latitude?: number;
  longitude?: number;
  radius?: number;
  city?: string;
  state?: string;
  query?: string;
  location_type?: 'fixed' | 'mobile' | 'hybrid';
  profile_type?: 'individual' | 'business';
  verified_only?: boolean;
  category?: string;
  min_price?: number;
  max_price?: number;
  limit?: number;
  offset?: number;
}

export interface MarketplaceSearchResponse {
  storefronts: MarketplaceStorefront[];
  total_count: number;
  query: MarketplaceSearchParams;
}

// ================================================================
// EXPORT CONFIGURED AXIOS INSTANCE
// ================================================================

// Export the configured axios instance for use in other parts of the application
// This allows other modules to make custom API calls while still benefiting from:
// - Automatic authentication headers
// - Centralized error handling
// - Base URL configuration
// - Request/response interceptors
export default apiClient;
