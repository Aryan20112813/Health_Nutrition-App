import { z } from 'zod';

export const replaceMealSchema = z.object({
  mealType: z.string().min(1, 'mealType or mealId is required'),
});

export const logPlanMealSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD')
    .optional(),
});
