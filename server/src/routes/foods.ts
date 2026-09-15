import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import { Food } from '../models/Food';
import { searchFoodSchema } from '../validators/food';
import { seedFoodCatalogIfNeeded } from '../data/seedFoods';

export const foodsRouter = Router();

// Protect all food routes as per TechSpec: Auth = Yes
foodsRouter.use(requireAuth);

/**
 * GET /api/v1/foods
 * FR-CAL-001: Search food catalog by name, category, or dietary tags.
 */
foodsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = searchFoodSchema.parse(req.query);
    const { query, category, dietaryTag, limit, page } = validated;

    // Ensure initial catalog is seeded
    await seedFoodCatalogIfNeeded();

    const filter: Record<string, any> = { isActive: true };

    if (query && query.trim().length > 0) {
      const sanitized = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(sanitized, 'i');
      filter.$or = [
        { name: regex },
        { normalizedName: regex },
        { tags: regex },
        { category: regex },
      ];
    }

    if (category && category !== 'All') {
      filter.category = new RegExp(`^${category}$`, 'i');
    }

    if (dietaryTag) {
      filter.dietaryTags = dietaryTag.toLowerCase();
    }

    const skip = (page - 1) * limit;

    const [foods, total] = await Promise.all([
      Food.find(filter)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Food.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        foods: foods.map((f) => ({
          id: f._id.toString(),
          name: f.name,
          category: f.category,
          serving: f.serving,
          nutritionPerServing: f.nutritionPerServing,
          alternativeUnits: f.alternativeUnits || [],
          tags: f.tags || [],
          dietaryTags: f.dietaryTags || [],
        })),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});
