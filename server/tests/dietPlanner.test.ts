import { describe, it, expect } from 'vitest';
import {
  calculateEstimatedTarget,
  filterFoodsForUser,
} from '../src/services/dietPlannerService';
import { IFood } from '../src/models/Food';

describe('Diet Planner Service Unit Tests (Phase 4)', () => {
  describe('calculateEstimatedTarget (FR-DIET-002)', () => {
    it('calculates expected Mifflin-St Jeor target for maintain goal', () => {
      const result = calculateEstimatedTarget({
        displayName: 'Test User',
        heightCm: 175,
        weightKg: 70,
        sex: 'male',
        goal: 'maintain',
        activityLevel: 'moderate',
        fitnessLevel: 'intermediate',
      });

      // BMR = 10*70 + 6.25*175 - 5*28 + 5 = 700 + 1093.75 - 140 + 5 = 1658.75 -> 1659
      // TDEE = 1659 * 1.55 = 2571
      // Target = 2571
      expect(result.bmr).toBeGreaterThan(1500);
      expect(result.tdee).toBeGreaterThan(2000);
      expect(result.estimatedTarget).toBe(result.tdee);
      expect(result.macroTarget.proteinG).toBeGreaterThan(0);
      expect(result.macroTarget.carbsG).toBeGreaterThan(0);
      expect(result.macroTarget.fatG).toBeGreaterThan(0);
      expect(result.formulaVersion).toBe('Mifflin-StJeor-v1');
    });

    it('applies negative goal adjustment for lose_weight', () => {
      const maintainResult = calculateEstimatedTarget({
        displayName: 'Test User',
        heightCm: 175,
        weightKg: 70,
        sex: 'male',
        goal: 'maintain',
        activityLevel: 'moderate',
        fitnessLevel: 'intermediate',
      });

      const weightLossResult = calculateEstimatedTarget({
        displayName: 'Test User',
        heightCm: 175,
        weightKg: 70,
        sex: 'male',
        goal: 'lose_weight',
        activityLevel: 'moderate',
        fitnessLevel: 'intermediate',
      });

      expect(weightLossResult.estimatedTarget).toBe(maintainResult.estimatedTarget - 400);
    });

    it('applies positive goal adjustment for gain_weight', () => {
      const maintainResult = calculateEstimatedTarget({
        displayName: 'Test User',
        heightCm: 175,
        weightKg: 70,
        sex: 'female',
        goal: 'maintain',
        activityLevel: 'light',
        fitnessLevel: 'beginner',
      });

      const weightGainResult = calculateEstimatedTarget({
        displayName: 'Test User',
        heightCm: 175,
        weightKg: 70,
        sex: 'female',
        goal: 'gain_weight',
        activityLevel: 'light',
        fitnessLevel: 'beginner',
      });

      expect(weightGainResult.estimatedTarget).toBe(maintainResult.estimatedTarget + 400);
    });

    it('clamps calorie targets to safe wellness bounds (1200 - 4000 kcal)', () => {
      // Extremely low weight / height
      const lowResult = calculateEstimatedTarget({
        displayName: 'Low User',
        heightCm: 140,
        weightKg: 35,
        sex: 'female',
        goal: 'lose_weight',
        activityLevel: 'sedentary',
        fitnessLevel: 'beginner',
      });

      expect(lowResult.estimatedTarget).toBeGreaterThanOrEqual(1200);

      // Extremely high weight / height / activity
      const highResult = calculateEstimatedTarget({
        displayName: 'High User',
        heightCm: 210,
        weightKg: 150,
        sex: 'male',
        goal: 'gain_weight',
        activityLevel: 'high',
        fitnessLevel: 'advanced',
      });

      expect(highResult.estimatedTarget).toBeLessThanOrEqual(4000);
    });
  });

  describe('filterFoodsForUser (FR-DIET-001 & FR-DIET-003)', () => {
    const mockFoods = [
      {
        name: 'Whole Wheat Roti',
        tags: ['roti', 'wheat'],
        dietaryTags: ['vegetarian', 'vegan'],
      },
      {
        name: 'Paneer Tikka',
        tags: ['paneer', 'dairy'],
        dietaryTags: ['vegetarian'],
      },
      {
        name: 'Grilled Chicken Breast',
        tags: ['chicken', 'poultry'],
        dietaryTags: ['non-vegetarian'],
      },
      {
        name: 'Boiled Egg',
        tags: ['egg'],
        dietaryTags: ['eggetarian'],
      },
      {
        name: 'Peanut Butter Toast',
        tags: ['peanut', 'bread'],
        dietaryTags: ['vegetarian', 'vegan'],
      },
    ] as IFood[];

    it('filters out non-vegan foods for vegan preference', () => {
      const result = filterFoodsForUser(mockFoods, 'vegan');
      expect(result.map((f) => f.name)).toEqual(['Whole Wheat Roti', 'Peanut Butter Toast']);
    });

    it('filters out meat/poultry for vegetarian preference', () => {
      const result = filterFoodsForUser(mockFoods, 'vegetarian');
      expect(result.map((f) => f.name)).toEqual(['Whole Wheat Roti', 'Paneer Tikka', 'Peanut Butter Toast']);
    });

    it('filters out foods matching user dietary restrictions', () => {
      const result = filterFoodsForUser(mockFoods, 'vegetarian', ['dairy', 'peanut']);
      expect(result.map((f) => f.name)).toEqual(['Whole Wheat Roti']);
    });
  });
});
