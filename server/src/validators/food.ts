import { z } from 'zod';

export const searchFoodSchema = z.object({
  query: z.string().trim().max(100).optional(),
  category: z.string().trim().max(50).optional(),
  dietaryTag: z.string().trim().max(50).optional(),
  limit: z.coerce.number().min(1).max(100).default(30),
  page: z.coerce.number().min(1).default(1),
});
