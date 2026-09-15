import mongoose, { Document, Schema, Model } from 'mongoose';

export type ServingUnit = 'g' | 'ml' | 'piece' | 'serving';

export interface IAlternativeUnit {
  unit: ServingUnit;
  gramsEquivalent: number;
}

export interface INutritionPerServing {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number | null;
}

export interface IFood extends Document {
  name: string;
  normalizedName: string;
  category: string;
  serving: {
    amount: number;
    unit: ServingUnit;
  };
  nutritionPerServing: INutritionPerServing;
  alternativeUnits: IAlternativeUnit[];
  tags: string[];
  dietaryTags: string[];
  source: 'curated' | 'external_import';
  sourceReference?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FoodSchema = new Schema<IFood>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    normalizedName: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    serving: {
      amount: { type: Number, required: true, min: 0.1 },
      unit: {
        type: String,
        enum: ['g', 'ml', 'piece', 'serving'],
        required: true,
      },
    },
    nutritionPerServing: {
      calories: { type: Number, required: true, min: 0 },
      proteinG: { type: Number, required: true, min: 0 },
      carbsG: { type: Number, required: true, min: 0 },
      fatG: { type: Number, required: true, min: 0 },
      fiberG: { type: Number, default: null },
    },
    alternativeUnits: [
      {
        unit: {
          type: String,
          enum: ['g', 'ml', 'piece', 'serving'],
          required: true,
        },
        gramsEquivalent: { type: Number, required: true, min: 0.1 },
      },
    ],
    tags: [{ type: String, trim: true }],
    dietaryTags: [{ type: String, trim: true }],
    source: {
      type: String,
      enum: ['curated', 'external_import'],
      default: 'curated',
    },
    sourceReference: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

FoodSchema.index({ normalizedName: 1 });
FoodSchema.index({ category: 1, isActive: 1 });

export const Food: Model<IFood> =
  mongoose.models.Food || mongoose.model<IFood>('Food', FoodSchema);
