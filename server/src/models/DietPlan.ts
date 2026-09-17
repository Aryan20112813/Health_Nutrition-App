import mongoose, { Schema, Document } from 'mongoose';

export interface IDietPlanFood {
  foodId: mongoose.Types.ObjectId | null;
  foodNameSnapshot: string;
  quantity: number;
  unit: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface IDietPlanMeal {
  _id: mongoose.Types.ObjectId;
  mealType: string; // 'breakfast' | 'lunch' | 'snack' | 'dinner'
  title: string;
  description: string;
  foods: IDietPlanFood[];
  totals: {
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  };
}

export interface IDietPlan extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  status: 'current' | 'archived';
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
  meals: IDietPlanMeal[];
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const dietPlanFoodSchema = new Schema<IDietPlanFood>(
  {
    foodId: { type: Schema.Types.ObjectId, ref: 'Food', default: null },
    foodNameSnapshot: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true },
    calories: { type: Number, required: true, min: 0 },
    proteinG: { type: Number, required: true, min: 0 },
    carbsG: { type: Number, required: true, min: 0 },
    fatG: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const dietPlanMealSchema = new Schema<IDietPlanMeal>({
  mealType: {
    type: String,
    required: true,
    enum: ['breakfast', 'lunch', 'snack', 'dinner'],
  },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  foods: [dietPlanFoodSchema],
  totals: {
    calories: { type: Number, required: true, min: 0 },
    proteinG: { type: Number, required: true, min: 0 },
    carbsG: { type: Number, required: true, min: 0 },
    fatG: { type: Number, required: true, min: 0 },
  },
});

const dietPlanSchema = new Schema<IDietPlan>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: {
      type: String,
      enum: ['current', 'archived'],
      default: 'current',
      required: true,
    },
    goal: { type: String, required: true },
    estimatedCalorieTarget: { type: Number, required: true, min: 500, max: 10000 },
    nutritionTarget: {
      proteinG: { type: Number, default: null },
      carbsG: { type: Number, default: null },
      fatG: { type: Number, default: null },
    },
    preferencesSnapshot: {
      dietaryPreference: { type: String, required: true },
      restrictions: [{ type: String }],
      mealsPerDay: { type: Number, default: 4 },
    },
    meals: [dietPlanMealSchema],
    generatedAt: { type: Date, default: Date.now, required: true },
  },
  {
    timestamps: true,
  }
);

// Compound index for reading current active plan quickly as specified in Schema.md
dietPlanSchema.index({ userId: 1, status: 1, generatedAt: -1 });

export const DietPlan = mongoose.model<IDietPlan>('DietPlan', dietPlanSchema);
