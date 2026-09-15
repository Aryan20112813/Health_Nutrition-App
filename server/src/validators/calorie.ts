import { z } from 'zod';

const allowedUnits = z.enum(['g', 'ml', 'piece', 'serving']);
const allowedMealTypes = z.enum(['breakfast', 'lunch', 'dinner', 'snack']);

export const createCalorieLogSchema = z
  .object({
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'),
    mealType: allowedMealTypes,
    quantity: z
      .number()
      .positive('Quantity must be greater than 0')
      .max(10000, 'Quantity must not exceed 10,000'),
    unit: allowedUnits,
    foodId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Food ObjectId format').optional(),
    manualFood: z
      .object({
        name: z.string().trim().min(1, 'Food name is required').max(120),
        calories: z.number().min(0, 'Calories cannot be negative').max(5000),
        proteinG: z.number().min(0, 'Protein cannot be negative').max(500),
        carbsG: z.number().min(0, 'Carbs cannot be negative').max(500),
        fatG: z.number().min(0, 'Fat cannot be negative').max(500),
        fiberG: z.number().min(0).max(200).optional().nullable(),
      })
      .optional(),
  })
  .refine((data) => data.foodId || data.manualFood, {
    message: 'Either foodId (from catalog) or manualFood details must be provided',
    path: ['foodId'],
  });

export const updateCalorieLogSchema = z.object({
  quantity: z
    .number()
    .positive('Quantity must be greater than 0')
    .max(10000, 'Quantity must not exceed 10,000')
    .optional(),
  unit: allowedUnits.optional(),
  mealType: allowedMealTypes.optional(),
  foodNameSnapshot: z.string().trim().min(1).max(120).optional(),
});

export const getCalorieLogsQuerySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD')
    .optional(),
});
