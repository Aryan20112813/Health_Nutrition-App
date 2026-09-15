import { z } from 'zod';

export const registerSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .trim()
    .toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Za-z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  displayName: z.string().trim().max(50, 'Display name cannot exceed 50 characters').optional(),
});

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .trim()
    .toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters long')
    .regex(/[A-Za-z]/, 'New password must contain at least one letter')
    .regex(/[0-9]/, 'New password must contain at least one number'),
});

export const updateProfileSchema = z.object({
  displayName: z.string().trim().max(50).optional(),
  dateOfBirth: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  sex: z.enum(['female', 'male', 'other', 'prefer_not_to_say']).optional(),
  heightCm: z.number().min(50, 'Height must be at least 50 cm').max(280, 'Height must be under 280 cm').optional(),
  weightKg: z.number().min(20, 'Weight must be at least 20 kg').max(400, 'Weight must be under 400 kg').optional(),
  goal: z.enum(['maintain', 'lose_weight', 'gain_weight', 'improve_fitness']).optional(),
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'high']).optional(),
  fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  dietaryPreference: z.enum(['omnivore', 'vegetarian', 'vegan', 'other']).optional(),
  restrictions: z.array(z.string().max(40)).max(20).optional(),
  excludedFoods: z.array(z.string().max(50)).max(50).optional(),
  equipment: z.array(z.string().max(40)).max(20).optional(),
  workoutDurationMin: z.number().min(5).max(180).optional(),
  mealsPerDay: z.number().min(1).max(8).optional(),
});
