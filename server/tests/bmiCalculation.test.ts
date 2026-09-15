import { describe, it, expect } from 'vitest';
import {
  calculateBmi,
  categorizeBmi,
  getBmiCategoryLabel,
  calculateIdealWeightRange,
  analyzeBmi,
} from '../src/services/bmiService';

describe('BMI Calculation and Categorization Logic (FR-BMI-001, FR-BMI-002, FR-BMI-003)', () => {
  it('calculates BMI accurately using weight(kg) / height(m)^2 rounded to 1 decimal place', () => {
    // 70 kg, 175 cm (1.75m): 70 / (1.75 * 1.75) = 70 / 3.0625 = 22.857... -> 22.9
    expect(calculateBmi(70, 175)).toBe(22.9);

    // 50 kg, 160 cm: 50 / 2.56 = 19.531... -> 19.5
    expect(calculateBmi(50, 160)).toBe(19.5);

    // 85 kg, 170 cm: 85 / 2.89 = 29.411... -> 29.4
    expect(calculateBmi(85, 170)).toBe(29.4);

    // 100 kg, 175 cm: 100 / 3.0625 = 32.65... -> 32.7
    expect(calculateBmi(100, 175)).toBe(32.7);
  });

  it('throws error for non-positive height or weight', () => {
    expect(() => calculateBmi(0, 175)).toThrow();
    expect(() => calculateBmi(70, 0)).toThrow();
    expect(() => calculateBmi(-5, 175)).toThrow();
    expect(() => calculateBmi(70, -10)).toThrow();
  });

  it('correctly categorizes BMI thresholds (FR-BMI-003)', () => {
    // Underweight: < 18.5
    expect(categorizeBmi(17.4)).toBe('underweight');
    expect(categorizeBmi(18.4)).toBe('underweight');

    // Normal weight: 18.5 - 24.9
    expect(categorizeBmi(18.5)).toBe('normal');
    expect(categorizeBmi(22.0)).toBe('normal');
    expect(categorizeBmi(24.9)).toBe('normal');

    // Overweight: 25.0 - 29.9
    expect(categorizeBmi(25.0)).toBe('overweight');
    expect(categorizeBmi(27.5)).toBe('overweight');
    expect(categorizeBmi(29.9)).toBe('overweight');

    // Obesity: >= 30.0
    expect(categorizeBmi(30.0)).toBe('obesity');
    expect(categorizeBmi(35.5)).toBe('obesity');
  });

  it('provides correct category labels', () => {
    expect(getBmiCategoryLabel('underweight')).toBe('Underweight');
    expect(getBmiCategoryLabel('normal')).toBe('Normal weight');
    expect(getBmiCategoryLabel('overweight')).toBe('Overweight');
    expect(getBmiCategoryLabel('obesity')).toBe('Obese');
  });

  it('computes ideal weight range for height based on normal BMI bounds (18.5 to 24.9)', () => {
    // 180 cm: 18.5 * 1.8^2 = 18.5 * 3.24 = 59.94 -> 59.9 kg
    // 24.9 * 3.24 = 80.676 -> 80.7 kg
    const range180 = calculateIdealWeightRange(180);
    expect(range180.minKg).toBe(59.9);
    expect(range180.maxKg).toBe(80.7);

    // 170 cm: 18.5 * 2.89 = 53.465 -> 53.5 kg
    // 24.9 * 2.89 = 71.961 -> 72.0 kg
    const range170 = calculateIdealWeightRange(170);
    expect(range170.minKg).toBe(53.5);
    expect(range170.maxKg).toBe(72.0);
  });

  it('produces complete analysis object in analyzeBmi', () => {
    const analysis = analyzeBmi(68, 172);
    expect(analysis.bmi).toBe(23.0);
    expect(analysis.category).toBe('normal');
    expect(analysis.categoryLabel).toBe('Normal weight');
    expect(analysis.idealWeightRange.minKg).toBeGreaterThan(0);
    expect(analysis.idealWeightRange.maxKg).toBeGreaterThan(analysis.idealWeightRange.minKg);
  });
});
