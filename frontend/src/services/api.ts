import axios, { AxiosInstance, AxiosResponse } from 'axios';

// ================================================================
// BASE API CONFIGURATION
// ================================================================

// Base URL for all API requests - points to your Express.js backend server
// This is automatically prepended to all relative URLs in API calls
// For landing page deployment, this won't be used, but we configure it for future expansion
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

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
// EXPORT CONFIGURED AXIOS INSTANCE
// ================================================================

// Export the configured axios instance for use in other parts of the application
// This allows other modules to make custom API calls while still benefiting from:
// - Automatic authentication headers
// - Centralized error handling
// - Base URL configuration
// - Request/response interceptors
export default apiClient;
