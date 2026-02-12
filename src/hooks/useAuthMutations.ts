import { useMutation } from '@tanstack/react-query';
import { authService } from '@services/authService';
import { secureStorage } from '@utils/secureStorage';
import { connectDatabase, disconnectDatabase } from '@database/database';
import { useAuth } from './useAuth';
import type { LoginCredentials, RegisterCredentials } from '@/types/auth';

export function useLogin() {
  const { setAuth } = useAuth();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => authService.login(credentials),
    onSuccess: async (data) => {
      await Promise.all([secureStorage.setToken(data.token), secureStorage.setUser(data.user)]);
      setAuth(data.user, data.token);
      await connectDatabase();
    },
  });
}

export function useRegister() {
  const { setAuth } = useAuth();

  return useMutation({
    mutationFn: (credentials: RegisterCredentials) => authService.register(credentials),
    onSuccess: async (data) => {
      await Promise.all([secureStorage.setToken(data.token), secureStorage.setUser(data.user)]);
      setAuth(data.user, data.token);
      await connectDatabase();
    },
  });
}

export function useLogout() {
  const { clearAuth } = useAuth();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: async () => {
      await disconnectDatabase();
      await secureStorage.clear();
      clearAuth();
    },
    onError: async () => {
      // Clear locally even if server logout fails
      await disconnectDatabase();
      await secureStorage.clear();
      clearAuth();
    },
  });
}
