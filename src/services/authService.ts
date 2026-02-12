import { Platform } from 'react-native';
import type {
  IAuthService,
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
  User,
} from '@/types/auth';
import { AuthResponseSchema } from '@database/schemas';
import { powersyncConfig } from '@constants/config';
import { secureStorage } from '@utils/secureStorage';

const API_URL = powersyncConfig.backendUrl;

function getDeviceInfo() {
  return {
    fingerprint: `${Platform.OS}-${Platform.Version}`,
    type: Platform.OS,
    os_version: String(Platform.Version),
    name: `${Platform.OS} device`,
  };
}

interface FetchOptions {
  method: string;
  headers?: Record<string, string>;
  body?: string;
}

async function apiRequest<T>(path: string, options: FetchOptions): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    const message = data?.errors?.detail ?? data?.error ?? 'Request failed';
    throw new Error(message);
  }

  return data;
}

class ApiAuthService implements IAuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const data = await apiRequest<{ user: User; access_token: string; device_id: string }>(
      '/api/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
          device: getDeviceInfo(),
        }),
      }
    );

    const result = { user: data.user, token: data.access_token };
    return AuthResponseSchema.parse(result);
  }

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const data = await apiRequest<{ user: User; access_token: string; device_id: string }>(
      '/api/auth/register',
      {
        method: 'POST',
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
          username: credentials.username,
          first_name: credentials.firstName,
          last_name: credentials.lastName,
          device: getDeviceInfo(),
        }),
      }
    );

    const result = { user: data.user, token: data.access_token };
    return AuthResponseSchema.parse(result);
  }

  async logout(): Promise<void> {
    const token = await secureStorage.getToken();
    if (!token) return;

    await apiRequest('/api/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {
      // Logout should succeed locally even if the server call fails
    });
  }

  async refreshToken(_token: string): Promise<AuthResponse> {
    throw new Error('Token refresh not yet implemented');
  }

  async getCurrentUser(_token: string): Promise<User> {
    throw new Error('getCurrentUser not yet implemented');
  }
}

export const authService: IAuthService = new ApiAuthService();
