import { z } from 'zod';

export const createBmiRecordSchema = z.object({
  heightCm: z
    .number()
    .min(50, 'Height must be at least 50 cm')
    .max(280, 'Height must be under 280 cm'),
  weightKg: z
    .number()
    .min(20, 'Weight must be at least 20 kg')
    .max(400, 'Weight must be under 400 kg'),
  recordedAt: z
    .string()
    .datetime()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .optional(),
});

export const getBmiRecordsQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  page: z.coerce.number().min(1).default(1),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
