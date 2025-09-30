import { createContext, ReactNode, useContext, useMemo, useState } from 'react';

import { login as loginRequest, signup as signupRequest } from '../lib/api-client';
import type { AuthResponse, AuthUser } from '../types/api';

interface AuthContextValue {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<AuthResponse>;
  signup: (username: string, password: string) => Promise<AuthResponse>;
  logout: () => void;
  clearError: () => void;
}

const STORAGE_TOKEN_KEY = 'macro-calculator-token';
const STORAGE_USER_KEY = 'macro-calculator-user';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(STORAGE_TOKEN_KEY));
  const [user, setUser] = useState<AuthUser | null>(() => {
    const raw = localStorage.getItem(STORAGE_USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuthSuccess = (auth: AuthResponse) => {
    setToken(auth.token);
    setUser(auth.user);
    localStorage.setItem(STORAGE_TOKEN_KEY, auth.token);
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(auth.user));
  };

  const login = async (username: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const auth = await loginRequest(username, password);
      handleAuthSuccess(auth);
      return auth;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to login';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (username: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const auth = await signupRequest(username, password);
      handleAuthSuccess(auth);
      return auth;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to signup';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(STORAGE_TOKEN_KEY);
    localStorage.removeItem(STORAGE_USER_KEY);
  };

  const clearError = () => setError(null);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      loading,
      error,
      login,
      signup,
      logout,
      clearError
    }),
    [token, user, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
