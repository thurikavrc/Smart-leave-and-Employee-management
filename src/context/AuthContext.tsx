import React, { createContext, useCallback, useEffect, useState } from 'react';
import { AuthCredentials, User, UserRole } from '@/src/types';
import { authService } from '@/src/services/authService';
import { USER_STORAGE_KEY } from '@/src/services/apiClient';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isMockAuth: boolean;
  login: (credentials: AuthCredentials) => Promise<User>;
  logout: () => void;
  updateCurrentUser: (patch: Partial<User>) => void;
  getDefaultRouteForRole: (role: UserRole) => string;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function getDefaultRouteForRole(role: UserRole): string {
  switch (role) {
    case UserRole.ADMIN:
      return '/admin/dashboard';
    case UserRole.MANAGER:
      return '/manager/dashboard';
    case UserRole.EMPLOYEE:
    default:
      return '/employee/dashboard';
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMockAuth, setIsMockAuth] = useState(true);

  useEffect(() => {
    const storedUser = authService.getStoredUser();
    const storedToken = authService.getStoredToken();
    if (storedUser && storedToken) {
      setUser(storedUser);
      setIsMockAuth(storedToken.startsWith('demo-mock-jwt-token'));
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (credentials: AuthCredentials): Promise<User> => {
    const response = await authService.login(credentials);
    setUser(response.user);
    setIsMockAuth(Boolean(response.isMockAuth));
    return response.user;
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  const updateCurrentUser = useCallback((patch: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...patch };
      if (localStorage.getItem(USER_STORAGE_KEY)) {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated));
      } else if (sessionStorage.getItem(USER_STORAGE_KEY)) {
        sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated));
      }
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        isMockAuth,
        login,
        logout,
        updateCurrentUser,
        getDefaultRouteForRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
