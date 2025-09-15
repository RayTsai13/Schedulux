import axios, { AxiosInstance, AxiosResponse } from 'axios';

// Base API configuration
const API_BASE_URL = 'http://localhost:3000/api';

// Create axios instance with default configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear stored token and redirect to login
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: 'vendor' | 'client';
  phone?: string;
  timezone?: string;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: 'vendor' | 'client';
  phone?: string;
  timezone?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Authentication API functions
export const authApi = {
  // User registration
  register: async (userData: RegisterRequest): Promise<ApiResponse<AuthResponse>> => {
    try {
      const response = await apiClient.post('/auth/register', userData);
      
      // Store token and user data
      if (response.data.success && response.data.data) {
        localStorage.setItem('auth_token', response.data.data.token);
        localStorage.setItem('user_data', JSON.stringify(response.data.data.user));
      }
      
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: 'Network error',
        message: 'Unable to connect to server. Please try again.',
      };
    }
  },

  // User login
  login: async (credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> => {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      
      // Store token and user data
      if (response.data.success && response.data.data) {
        localStorage.setItem('auth_token', response.data.data.token);
        localStorage.setItem('user_data', JSON.stringify(response.data.data.user));
      }
      
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: 'Network error',
        message: 'Unable to connect to server. Please try again.',
      };
    }
  },

  // Get current user profile
  me: async (): Promise<ApiResponse<User>> => {
    try {
      const response = await apiClient.get('/auth/me');
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: 'Network error',
        message: 'Unable to fetch user profile.',
      };
    }
  },

  // Logout user
  logout: (): void => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    window.location.href = '/login';
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('auth_token');
    return !!token;
  },

  // Get stored user data
  getCurrentUser: (): User | null => {
    const userData = localStorage.getItem('user_data');
    if (userData) {
      try {
        return JSON.parse(userData);
      } catch {
        return null;
      }
    }
    return null;
  },

  // Get stored auth token
  getToken: (): string | null => {
    return localStorage.getItem('auth_token');
  },
};

// General API functions
export const api = {
  // Health check
  health: async (): Promise<any> => {
    try {
      const response = await apiClient.get('/health');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // API info
  info: async (): Promise<any> => {
    try {
      const response = await apiClient.get('/');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default apiClient;
