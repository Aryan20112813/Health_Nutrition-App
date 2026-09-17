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
          message: json.message || 'An error occurred during diet plan request',
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

export interface IDietPlanMealFood {
  foodId: string | null;
  foodNameSnapshot: string;
  quantity: number;
  unit: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface IDietPlanMealItem {
  id: string;
  mealType: string;
  title: string;
  description: string;
  foods: IDietPlanMealFood[];
  totals: {
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  };
}

export interface IDietPlanData {
  id: string;
  goal: string;
  estimatedCalorieTarget: number;
  nutritionTarget: {
    proteinG: number | null;
    carbsG: number | null;
    fatG: number | null;
  };
  preferencesSnapshot: {
    dietaryPreference: string;
    restrictions: string[];
    mealsPerDay: number;
  };
  meals: IDietPlanMealItem[];
  generatedAt: string;
  disclaimer: string;
}

export const dietApi = {
  /**
   * GET /api/v1/diet-plans/current
   */
  async getCurrentPlan(): Promise<ApiResponse<{ plan: IDietPlanData }>> {
    return request<{ plan: IDietPlanData }>('/diet-plans/current');
  },

  /**
   * POST /api/v1/diet-plans/generate
   */
  async generatePlan(): Promise<ApiResponse<{ plan: IDietPlanData }>> {
    return request<{ plan: IDietPlanData }>('/diet-plans/generate', {
      method: 'POST',
    });
  },

  /**
   * POST /api/v1/diet-plans/:planId/replace-meal
   */
  async replaceMeal(
    planId: string,
    mealType: string
  ): Promise<ApiResponse<{ plan: IDietPlanData }>> {
    return request<{ plan: IDietPlanData }>(`/diet-plans/${planId}/replace-meal`, {
      method: 'POST',
      body: JSON.stringify({ mealType }),
    });
  },

  /**
   * POST /api/v1/diet-plans/:planId/meals/:mealId/log
   */
  async logPlanMeal(
    planId: string,
    mealId: string,
    date?: string
  ): Promise<ApiResponse<{ loggedCount: number; mealType: string }>> {
    return request<{ loggedCount: number; mealType: string }>(
      `/diet-plans/${planId}/meals/${mealId}/log`,
      {
        method: 'POST',
        body: JSON.stringify({ date }),
      }
    );
  },
};
