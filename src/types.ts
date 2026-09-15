export type ScreenId =
  | 'dashboard'
  | 'nutrition-and-calorie-tracking'
  | 'personalized-diet-plan'
  | 'exercise-recommendation'
  | 'ai-food-scanner'
  | 'bmi-and-body-health'
  | 'auth-login'
  | 'auth-register'
  | 'onboarding'
  | 'profile-settings';

export interface AuthUser {
  id: string;
  email: string;
  status: 'active' | 'disabled';
  profile: {
    displayName: string;
    dateOfBirth?: string;
    sex: 'female' | 'male' | 'other' | 'prefer_not_to_say';
    heightCm: number;
    weightKg: number;
    goal: 'maintain' | 'lose_weight' | 'gain_weight' | 'improve_fitness';
    activityLevel: 'sedentary' | 'light' | 'moderate' | 'high';
    fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
  };
  preferences: {
    dietaryPreference: 'omnivore' | 'vegetarian' | 'vegan' | 'other';
    restrictions: string[];
    excludedFoods: string[];
    equipment: string[];
    workoutDurationMin: number;
    mealsPerDay: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface FoodItem {
  id: string;
  name: string;
  category: string;
  portion: string;
  grams?: number;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber?: number;
  time?: string;
  image?: string;
  badge?: string;
}

export interface MealSlot {
  id: 'breakfast' | 'lunch' | 'snack' | 'dinner';
  title: string;
  time: string;
  targetCalories: number;
  loggedCalories: number;
  items: FoodItem[];
  isSuggested?: boolean;
}

export interface UserProfile {
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  heightCm: number;
  weightKg: number;
  targetWeightKg: number;
  goal: string;
  activityLevel: string;
  dietPreference: 'Eggetarian' | 'Vegetarian' | 'Jain' | 'Non-Vegetarian';
  dailyCalorieBudget: number;
  targetProtein: number;
  targetCarbs: number;
  targetFats: number;
  targetFiber: number;
  hydrationGoalL: number;
  currentHydrationL: number;
  stepsToday: number;
  stepsGoal: number;
}

export interface DietPlanMeal {
  id: string;
  mealName: string;
  time: string;
  dishTitle: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  prepTime: string;
  cookingTip?: string;
  sleepTip?: string;
  alternative: string;
  completed: boolean;
  image: string;
}

export interface ExerciseMovement {
  id: string;
  name: string;
  target: string;
  setsReps: string;
  rest: string;
  formCue: string;
  calories: number;
  durationMin: number;
  completed?: boolean;
  imageUrl: string;
}

export interface BmiHistoryRecord {
  date: string;
  weight: number;
  bmi: number;
  status: string;
}

export interface BmiApiRecord {
  id: string;
  heightCm: number;
  weightKg: number;
  bmi: number;
  category: 'underweight' | 'normal' | 'overweight' | 'obesity';
  categoryLabel: string;
  idealWeightRange: {
    minKg: number;
    maxKg: number;
  };
  recordedAt: string;
  createdAt: string;
}

export interface BmiPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DetectedSegment {
  id: string;
  label: string;
  confidence: number;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  portion: string;
  portionOptions: string[];
  rect: { x: number; y: number; width: number; height: number };
  color: string;
}

export interface ICatalogFood {
  id: string;
  name: string;
  category: string;
  serving: {
    amount: number;
    unit: 'g' | 'ml' | 'piece' | 'serving';
  };
  nutritionPerServing: {
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    fiberG: number | null;
  };
  alternativeUnits: Array<{
    unit: 'g' | 'ml' | 'piece' | 'serving';
    gramsEquivalent: number;
  }>;
  tags: string[];
  dietaryTags: string[];
}

export interface ICalorieLogItem {
  id: string;
  date: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foodId: string | null;
  foodNameSnapshot: string;
  quantity: number;
  unit: 'g' | 'ml' | 'piece' | 'serving';
  nutrition: {
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    fiberG: number | null;
  };
  source: 'catalog' | 'manual' | 'food_recognition';
  createdAt: string;
}

export interface IDayLogSummary {
  date: string;
  targetCalories: number;
  consumedCalories: number;
  remainingCalories: number;
  macroTotals: {
    proteinG: number;
    carbsG: number;
    fatG: number;
    fiberG: number;
  };
  mealBreakdown: Record<
    'breakfast' | 'lunch' | 'dinner' | 'snack',
    {
      calories: number;
      itemCount: number;
    }
  >;
}

