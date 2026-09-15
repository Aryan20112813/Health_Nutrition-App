import { BmiCategory } from '../models/BmiRecord';

export interface BmiCalculationResult {
  bmi: number;
  category: BmiCategory;
  categoryLabel: string;
  idealWeightRange: {
    minKg: number;
    maxKg: number;
  };
}

/**
 * Calculates Body Mass Index (BMI) using metric formula:
 * BMI = weight (kg) / (height (m))^2
 * Rounded to one decimal place according to FR-BMI-002 and FR-BMI-003.
 */
export function calculateBmi(weightKg: number, heightCm: number): number {
  if (heightCm <= 0 || weightKg <= 0) {
    throw new Error('Height and weight must be greater than zero');
  }
  const heightM = heightCm / 100;
  const rawBmi = weightKg / (heightM * heightM);
  return Math.round(rawBmi * 10) / 10;
}

/**
 * Categorizes BMI according to standard WHO classifications:
 * - underweight: BMI < 18.5
 * - normal: 18.5 <= BMI < 25.0
 * - overweight: 25.0 <= BMI < 30.0
 * - obesity: BMI >= 30.0
 */
export function categorizeBmi(bmi: number): BmiCategory {
  if (bmi < 18.5) {
    return 'underweight';
  }
  if (bmi < 25.0) {
    return 'normal';
  }
  if (bmi < 30.0) {
    return 'overweight';
  }
  return 'obesity';
}

/**
 * Returns human-readable classification label
 */
export function getBmiCategoryLabel(category: BmiCategory): string {
  switch (category) {
    case 'underweight':
      return 'Underweight';
    case 'normal':
      return 'Normal weight';
    case 'overweight':
      return 'Overweight';
    case 'obesity':
      return 'Obese';
    default:
      return 'Unknown';
  }
}

/**
 * Calculates healthy/ideal weight range for a given height in cm (BMI 18.5 to 24.9)
 */
export function calculateIdealWeightRange(heightCm: number): { minKg: number; maxKg: number } {
  const heightM = heightCm / 100;
  const minKg = Math.round(18.5 * heightM * heightM * 10) / 10;
  const maxKg = Math.round(24.9 * heightM * heightM * 10) / 10;
  return { minKg, maxKg };
}

/**
 * Computes full analysis for provided metric measurements
 */
export function analyzeBmi(weightKg: number, heightCm: number): BmiCalculationResult {
  const bmi = calculateBmi(weightKg, heightCm);
  const category = categorizeBmi(bmi);
  const categoryLabel = getBmiCategoryLabel(category);
  const idealWeightRange = calculateIdealWeightRange(heightCm);

  return {
    bmi,
    category,
    categoryLabel,
    idealWeightRange,
  };
}
