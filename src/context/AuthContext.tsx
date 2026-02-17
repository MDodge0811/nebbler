import React, { createContext, useEffect, useState, useCallback, useMemo } from 'react';
import type { AuthState, User } from '@/types/auth';
import { secureStorage } from '@utils/secureStorage';
import { connectDatabase } from '@database/index';

export interface AuthContextValue extends AuthState {
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const [token, user] = await Promise.all([
          secureStorage.getToken(),
          secureStorage.getUser(),
        ]);

        if (token && user) {
          setState({
            user,
            token,
            isLoading: false,
            isAuthenticated: true,
          });
          // Reconnect PowerSync with the restored token
          connectDatabase().catch((err) =>
            console.error('[Auth] Failed to connect PowerSync:', err)
          );
        } else {
          setState((prev) => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('[Auth] Failed to initialize:', error);
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    initializeAuth();
  }, []);

  const setAuth = useCallback((user: User, token: string) => {
    setState({
      user,
      token,
      isLoading: false,
      isAuthenticated: true,
    });
  }, []);

  const clearAuth = useCallback(() => {
    setState({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
    });
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      setAuth,
      clearAuth,
    }),
    [state, setAuth, clearAuth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
