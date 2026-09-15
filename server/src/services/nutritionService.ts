import { ServingUnit, IAlternativeUnit, INutritionPerServing } from '../models/Food';
import { ICalorieLogNutrition, MealType } from '../models/CalorieLog';

export interface ScaleNutritionParams {
  serving: {
    amount: number;
    unit: ServingUnit;
  };
  nutritionPerServing: INutritionPerServing;
  quantity: number;
  unit: ServingUnit;
  alternativeUnits?: IAlternativeUnit[];
}

/**
 * FR-CAL-003: Deterministically scales calories and macronutrients based on serving and target quantity/unit.
 */
export function scaleNutrition(params: ScaleNutritionParams): ICalorieLogNutrition {
  const { serving, nutritionPerServing, quantity, unit, alternativeUnits = [] } = params;

  if (quantity <= 0) {
    throw new Error('Quantity must be greater than zero');
  }

  if (serving.amount <= 0) {
    throw new Error('Serving amount must be greater than zero');
  }

  let scaleFactor = 1;

  if (unit === serving.unit) {
    scaleFactor = quantity / serving.amount;
  } else {
    // Check if target unit is in alternativeUnits and base unit is 'g' or 'ml'
    const altTarget = alternativeUnits.find((alt) => alt.unit === unit);
    const altServing = alternativeUnits.find((alt) => alt.unit === serving.unit);

    if (altTarget && (serving.unit === 'g' || serving.unit === 'ml')) {
      const targetGrams = quantity * altTarget.gramsEquivalent;
      scaleFactor = targetGrams / serving.amount;
    } else if (altServing && (unit === 'g' || unit === 'ml')) {
      const targetPieces = quantity / altServing.gramsEquivalent;
      scaleFactor = targetPieces / serving.amount;
    } else {
      // Direct proportion fallback if direct conversion metadata is not provided
      scaleFactor = quantity / serving.amount;
    }
  }

  return {
    calories: Math.max(0, Math.round(nutritionPerServing.calories * scaleFactor)),
    proteinG: Math.max(0, Math.round(nutritionPerServing.proteinG * scaleFactor * 10) / 10),
    carbsG: Math.max(0, Math.round(nutritionPerServing.carbsG * scaleFactor * 10) / 10),
    fatG: Math.max(0, Math.round(nutritionPerServing.fatG * scaleFactor * 10) / 10),
    fiberG:
      nutritionPerServing.fiberG !== null && nutritionPerServing.fiberG !== undefined
        ? Math.max(0, Math.round(nutritionPerServing.fiberG * scaleFactor * 10) / 10)
        : null,
  };
}

export interface DayLogSummary {
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
    MealType,
    {
      calories: number;
      itemCount: number;
    }
  >;
}

/**
 * FR-CAL-004 & FR-CAL-009: Computes daily consumed calories, remaining calories, and macro totals.
 */
export function calculateDaySummary(
  date: string,
  targetCalories: number,
  logs: Array<{ mealType: MealType; nutrition: ICalorieLogNutrition }>
): DayLogSummary {
  let consumedCalories = 0;
  let totalProteinG = 0;
  let totalCarbsG = 0;
  let totalFatG = 0;
  let totalFiberG = 0;

  const mealBreakdown: Record<MealType, { calories: number; itemCount: number }> = {
    breakfast: { calories: 0, itemCount: 0 },
    lunch: { calories: 0, itemCount: 0 },
    dinner: { calories: 0, itemCount: 0 },
    snack: { calories: 0, itemCount: 0 },
  };

  for (const log of logs) {
    consumedCalories += log.nutrition.calories || 0;
    totalProteinG += log.nutrition.proteinG || 0;
    totalCarbsG += log.nutrition.carbsG || 0;
    totalFatG += log.nutrition.fatG || 0;
    totalFiberG += log.nutrition.fiberG || 0;

    if (mealBreakdown[log.mealType]) {
      mealBreakdown[log.mealType].calories += log.nutrition.calories || 0;
      mealBreakdown[log.mealType].itemCount += 1;
    }
  }

  const remainingCalories = Math.max(0, targetCalories - consumedCalories);

  return {
    date,
    targetCalories,
    consumedCalories,
    remainingCalories,
    macroTotals: {
      proteinG: Math.round(totalProteinG * 10) / 10,
      carbsG: Math.round(totalCarbsG * 10) / 10,
      fatG: Math.round(totalFatG * 10) / 10,
      fiberG: Math.round(totalFiberG * 10) / 10,
    },
    mealBreakdown,
  };
}
