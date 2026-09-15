import { ICatalogFood, ICalorieLogItem, IDayLogSummary } from '../types';
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
          message: json.message || 'An error occurred during calorie tracking request',
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

export interface SearchFoodsParams {
  query?: string;
  category?: string;
  dietaryTag?: string;
  limit?: number;
  page?: number;
}

export interface SearchFoodsResult {
  foods: ICatalogFood[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateCalorieLogPayload {
  date: string; // YYYY-MM-DD
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  quantity: number;
  unit: 'g' | 'ml' | 'piece' | 'serving';
  foodId?: string;
  manualFood?: {
    name: string;
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    fiberG?: number | null;
  };
}

export interface UpdateCalorieLogPayload {
  quantity?: number;
  unit?: 'g' | 'ml' | 'piece' | 'serving';
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foodNameSnapshot?: string;
}

export interface GetCalorieLogsResult {
  date: string;
  summary: IDayLogSummary;
  logs: ICalorieLogItem[];
}

export const calorieApi = {
  /**
   * GET /api/v1/foods (FR-CAL-001)
   * Search food catalog by query, category, or dietary tag.
   */
  async searchFoods(params: SearchFoodsParams = {}): Promise<ApiResponse<SearchFoodsResult>> {
    const queryParts: string[] = [];
    if (params.query) queryParts.push(`query=${encodeURIComponent(params.query)}`);
    if (params.category && params.category !== 'All') {
      queryParts.push(`category=${encodeURIComponent(params.category)}`);
    }
    if (params.dietaryTag) queryParts.push(`dietaryTag=${encodeURIComponent(params.dietaryTag)}`);
    if (params.limit) queryParts.push(`limit=${params.limit}`);
    if (params.page) queryParts.push(`page=${params.page}`);

    const qs = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    return request<SearchFoodsResult>(`/foods${qs}`);
  },

  /**
   * GET /api/v1/calorie-logs (FR-CAL-004, FR-CAL-006, FR-CAL-009)
   * Retrieves daily calorie logs and comprehensive nutritional summary.
   */
  async getCalorieLogs(date?: string): Promise<ApiResponse<GetCalorieLogsResult>> {
    const qs = date ? `?date=${encodeURIComponent(date)}` : '';
    return request<GetCalorieLogsResult>(`/calorie-logs${qs}`);
  },

  /**
   * POST /api/v1/calorie-logs (FR-CAL-002, FR-CAL-003, FR-CAL-007, FR-CAL-008)
   * Logs a food item or manual custom food into a specified meal slot.
   */
  async createLog(payload: CreateCalorieLogPayload): Promise<ApiResponse<{ log: ICalorieLogItem }>> {
    return request<{ log: ICalorieLogItem }>('/calorie-logs', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * PATCH /api/v1/calorie-logs/:id (FR-CAL-005)
   * Edits quantity/unit/meal and recalculates nutrition.
   */
  async updateLog(
    id: string,
    payload: UpdateCalorieLogPayload
  ): Promise<ApiResponse<{ log: ICalorieLogItem }>> {
    return request<{ log: ICalorieLogItem }>(`/calorie-logs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  /**
   * DELETE /api/v1/calorie-logs/:id (FR-CAL-005)
   * Removes a logged food item.
   */
  async deleteLog(id: string): Promise<ApiResponse<{ id: string }>> {
    return request<{ id: string }>(`/calorie-logs/${id}`, {
      method: 'DELETE',
    });
  },
};
