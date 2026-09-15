export type ScreenId =
  | 'dashboard'
  | 'nutrition-and-calorie-tracking'
  | 'personalized-diet-plan'
  | 'exercise-recommendation'
  | 'ai-food-scanner'
  | 'bmi-and-body-health';

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
