import { BmiApiRecord, BmiPagination } from '../types';
import { ApiResponse } from './authApi';

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
      credentials: 'include',
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

export const bmiApi = {
  /**
   * POST /api/v1/bmi/records (FR-BMI-001..004)
   * Validates inputs, calculates BMI, stores record linked to user, updates user height/weight.
   */
  async createRecord(body: { heightCm: number; weightKg: number; recordedAt?: string }) {
    return request<{ record: BmiApiRecord }>('/bmi/records', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  /**
   * GET /api/v1/bmi/records (FR-BMI-004)
   * Fetches user's own BMI history with pagination.
   */
  async getRecords(params?: { limit?: number; page?: number; startDate?: string; endDate?: string }) {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.page) query.set('page', String(params.page));
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);

    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<{ records: BmiApiRecord[]; pagination: BmiPagination }>(`/bmi/records${qs}`);
  },
};
