import mongoose, { Document, Schema, Model } from 'mongoose';
import { ServingUnit } from './Food';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type CalorieLogSource = 'catalog' | 'manual' | 'food_recognition';

export interface ICalorieLogNutrition {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number | null;
}

export interface ICalorieLog extends Document {
  userId: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD
  mealType: MealType;
  foodId: mongoose.Types.ObjectId | null;
  foodNameSnapshot: string;
  quantity: number;
  unit: ServingUnit;
  nutrition: ICalorieLogNutrition;
  source: CalorieLogSource;
  sourceRecognitionId: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const CalorieLogSchema = new Schema<ICalorieLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: String,
      required: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'],
    },
    mealType: {
      type: String,
      enum: ['breakfast', 'lunch', 'dinner', 'snack'],
      required: true,
    },
    foodId: {
      type: Schema.Types.ObjectId,
      ref: 'Food',
      default: null,
    },
    foodNameSnapshot: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [0.1, 'Quantity must be greater than 0'],
      max: [10000, 'Quantity must be realistic (under 10,000)'],
    },
    unit: {
      type: String,
      enum: ['g', 'ml', 'piece', 'serving'],
      required: true,
    },
    nutrition: {
      calories: { type: Number, required: true, min: 0 },
      proteinG: { type: Number, required: true, min: 0 },
      carbsG: { type: Number, required: true, min: 0 },
      fatG: { type: Number, required: true, min: 0 },
      fiberG: { type: Number, default: null },
    },
    source: {
      type: String,
      enum: ['catalog', 'manual', 'food_recognition'],
      default: 'catalog',
    },
    sourceRecognitionId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes defined in Schema.md:
// - { userId: 1, date: -1 }
// - { userId: 1, date: -1, mealType: 1 }
CalorieLogSchema.index({ userId: 1, date: -1 });
CalorieLogSchema.index({ userId: 1, date: -1, mealType: 1 });

export const CalorieLog: Model<ICalorieLog> =
  mongoose.models.CalorieLog || mongoose.model<ICalorieLog>('CalorieLog', CalorieLogSchema);
