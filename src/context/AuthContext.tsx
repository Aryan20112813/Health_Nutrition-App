import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AuthUser } from '../types';
import { authApi } from '../services/authApi';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, displayName?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<AuthUser['profile'] & AuthUser['preferences']>) => Promise<{ success: boolean; error?: string }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize and check current session on mount via HTTP-only cookie
  const refreshUser = useCallback(async () => {
    try {
      const res = await authApi.getMe();
      if (res.success && res.data?.user) {
        setUser(res.data.user);
      } else {
        // Try refresh token rotation if access token has expired
        const refreshRes = await authApi.refresh();
        if (refreshRes.success && refreshRes.data?.user) {
          setUser(refreshRes.data.user);
        } else {
          setUser(null);
        }
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    const res = await authApi.login({ email, password });
    setIsLoading(false);

    if (res.success && res.data?.user) {
      setUser(res.data.user);
      return { success: true };
    }
    return {
      success: false,
      error: res.error?.message || 'Login failed. Please verify your credentials.',
    };
  };

  const register = async (email: string, password: string, displayName?: string) => {
    setIsLoading(true);
    const res = await authApi.register({ email, password, displayName });
    setIsLoading(false);

    if (res.success && res.data?.user) {
      setUser(res.data.user);
      return { success: true };
    }
    return {
      success: false,
      error: res.error?.message || 'Registration failed.',
    };
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  };

  const updateProfile = async (data: Partial<AuthUser['profile'] & AuthUser['preferences']>) => {
    const res = await authApi.updateMe(data);
    if (res.success && res.data?.user) {
      setUser(res.data.user);
      return { success: true };
    }
    return {
      success: false,
      error: res.error?.message || 'Profile update failed.',
    };
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    const res = await authApi.changePassword({ currentPassword, newPassword });
    if (res.success) {
      return { success: true };
    }
    return {
      success: false,
      error: res.error?.message || 'Password update failed.',
    };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        changePassword,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
