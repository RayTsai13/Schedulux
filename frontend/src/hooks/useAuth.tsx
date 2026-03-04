import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { authApi, User, RegisterRequest } from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: RegisterRequest) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated on app load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = authApi.getToken();
        const storedUser = authApi.getCurrentUser();

        if (token && storedUser) {
          // Verify token is still valid by calling /me endpoint
          const response = await authApi.me();
          if (response.success && response.data) {
            setUser(response.data);
          } else {
            // Token is invalid, clear storage
            authApi.logout();
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        authApi.logout();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await authApi.login({ email, password });
      if (response.success && response.data) {
        setUser(response.data.user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (userData: RegisterRequest): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await authApi.register(userData);
      if (response.success && response.data) {
        setUser(response.data.user);
        return { success: true };
      }
      return { success: false, error: response.message || 'Registration failed' };
    } catch (error) {
      const axiosError = error as { response?: { status?: number; data?: { message?: string } } };
      const status = axiosError.response?.status;
      const message = axiosError.response?.data?.message;
      if (status === 409) {
        return { success: false, error: 'An account with this email already exists' };
      }
      return { success: false, error: message || 'An error occurred during registration' };
    }
  };

  const logout = () => {
    setUser(null);
    authApi.logout();
  };

  const refreshUser = async () => {
    try {
      const response = await authApi.me();
      if (response.success && response.data) {
        setUser(response.data);
      }
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
