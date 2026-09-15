import { describe, it, expect } from 'vitest';
import { scaleNutrition, calculateDaySummary } from '../src/services/nutritionService';

describe('Nutrition Scaling & Daily Aggregation (FR-CAL-003, FR-CAL-004, FR-CAL-009)', () => {
  const sampleFood = {
    serving: { amount: 100, unit: 'g' as const },
    nutritionPerServing: {
      calories: 130,
      proteinG: 2.7,
      carbsG: 28.2,
      fatG: 0.3,
      fiberG: 0.4,
    },
    alternativeUnits: [
      { unit: 'serving' as const, gramsEquivalent: 150 }, // 1 katori = 150g
    ],
  };

  it('FR-CAL-003: Accurately scales nutrition when logged in the base serving unit', () => {
    // 150g when base is 100g -> multiplier 1.5
    const scaled = scaleNutrition({
      serving: sampleFood.serving,
      nutritionPerServing: sampleFood.nutritionPerServing,
      quantity: 150,
      unit: 'g',
      alternativeUnits: sampleFood.alternativeUnits,
    });

    expect(scaled.calories).toBe(195); // 130 * 1.5 = 195
    expect(scaled.proteinG).toBe(4.1); // 2.7 * 1.5 = 4.05 -> rounded to 4.1
    expect(scaled.carbsG).toBe(42.3); // 28.2 * 1.5 = 42.3
    expect(scaled.fatG).toBe(0.5); // 0.3 * 1.5 = 0.45 -> 0.5
    expect(scaled.fiberG).toBe(0.6); // 0.4 * 1.5 = 0.6
  });

  it('FR-CAL-003: Accurately converts and scales through alternativeUnits', () => {
    // 2 servings when 1 serving = 150g and base is 100g -> total 300g -> multiplier 3.0
    const scaled = scaleNutrition({
      serving: sampleFood.serving,
      nutritionPerServing: sampleFood.nutritionPerServing,
      quantity: 2,
      unit: 'serving',
      alternativeUnits: sampleFood.alternativeUnits,
    });

    expect(scaled.calories).toBe(390); // 130 * 3
    expect(scaled.proteinG).toBe(8.1); // 2.7 * 3
    expect(scaled.carbsG).toBe(84.6); // 28.2 * 3
    expect(scaled.fatG).toBe(0.9); // 0.3 * 3
  });

  it('FR-CAL-008: Rejects invalid or non-positive quantities', () => {
    expect(() =>
      scaleNutrition({
        serving: sampleFood.serving,
        nutritionPerServing: sampleFood.nutritionPerServing,
        quantity: 0,
        unit: 'g',
      })
    ).toThrow('Quantity must be greater than zero');

    expect(() =>
      scaleNutrition({
        serving: sampleFood.serving,
        nutritionPerServing: sampleFood.nutritionPerServing,
        quantity: -50,
        unit: 'g',
      })
    ).toThrow('Quantity must be greater than zero');
  });

  it('FR-CAL-004 & FR-CAL-009: Calculates daily consumed, remaining budget, and macro totals correctly', () => {
    const logs = [
      {
        mealType: 'breakfast' as const,
        nutrition: { calories: 420, proteinG: 18.5, carbsG: 62.0, fatG: 10.2, fiberG: 5.0 },
      },
      {
        mealType: 'lunch' as const,
        nutrition: { calories: 650, proteinG: 32.0, carbsG: 78.5, fatG: 22.0, fiberG: 8.5 },
      },
      {
        mealType: 'snack' as const,
        nutrition: { calories: 180, proteinG: 6.0, carbsG: 24.0, fatG: 5.5, fiberG: 2.0 },
      },
    ];

    const targetCalories = 2200;
    const summary = calculateDaySummary('2026-09-15', targetCalories, logs);

    expect(summary.date).toBe('2026-09-15');
    expect(summary.targetCalories).toBe(2200);
    expect(summary.consumedCalories).toBe(1250); // 420 + 650 + 180
    expect(summary.remainingCalories).toBe(950); // 2200 - 1250

    expect(summary.macroTotals.proteinG).toBe(56.5); // 18.5 + 32.0 + 6.0
    expect(summary.macroTotals.carbsG).toBe(164.5); // 62.0 + 78.5 + 24.0
    expect(summary.macroTotals.fatG).toBe(37.7); // 10.2 + 22.0 + 5.5
    expect(summary.macroTotals.fiberG).toBe(15.5); // 5.0 + 8.5 + 2.0

    expect(summary.mealBreakdown.breakfast.calories).toBe(420);
    expect(summary.mealBreakdown.lunch.calories).toBe(650);
    expect(summary.mealBreakdown.dinner.calories).toBe(0);
    expect(summary.mealBreakdown.snack.calories).toBe(180);
  });

  it('FR-CAL-004: Clamps remaining calories at 0 when consumed exceeds target budget', () => {
    const logs = [
      {
        mealType: 'dinner' as const,
        nutrition: { calories: 2500, proteinG: 80, carbsG: 250, fatG: 70, fiberG: 20 },
      },
    ];

    const summary = calculateDaySummary('2026-09-15', 2000, logs);
    expect(summary.consumedCalories).toBe(2500);
    expect(summary.remainingCalories).toBe(0); // Clamped at 0
  });
});
