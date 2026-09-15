import { AuthUser } from '../types';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Array<{ field?: string; message: string }>;
  };
  message?: string;
}

const API_BASE = '/api/v1';

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include', // Automatically passes HTTP-only cookies
    });

    const json = await res.json();

    if (!res.ok) {
      return {
        success: false,
        error: json.error || {
          code: `HTTP_${res.status}`,
          message: json.message || 'An error occurred during request',
        },
      };
    }

    return json;
  } catch (err: any) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: err.message || 'Network connection failed. Please check your internet connection.',
      },
    };
  }
}

export const authApi = {
  async register(body: { email: string; password: string; displayName?: string }) {
    return request<{ user: AuthUser }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async login(body: { email: string; password: string }) {
    return request<{ user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async refresh() {
    return request<{ user: AuthUser }>('/auth/refresh', {
      method: 'POST',
    });
  },

  async logout() {
    return request<Record<string, never>>('/auth/logout', {
      method: 'POST',
    });
  },

  async changePassword(body: { currentPassword: string; newPassword: string }) {
    return request<Record<string, never>>('/auth/password', {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },

  async getMe() {
    return request<{ user: AuthUser }>('/users/me', {
      method: 'GET',
    });
  },

  async updateMe(updates: Partial<AuthUser['profile'] & AuthUser['preferences']>) {
    return request<{ user: AuthUser }>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },
};
