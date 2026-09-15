import { Router, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { CalorieLog } from '../models/CalorieLog';
import { Food } from '../models/Food';
import { User } from '../models/User';
import {
  createCalorieLogSchema,
  updateCalorieLogSchema,
  getCalorieLogsQuerySchema,
} from '../validators/calorie';
import { scaleNutrition, calculateDaySummary } from '../services/nutritionService';

export const calorieLogsRouter = Router();

calorieLogsRouter.use(requireAuth);

/**
 * POST /api/v1/calorie-logs
 * FR-CAL-002: Add a food item to a meal with quantity and unit.
 * FR-CAL-003: Calculate calories and macros for logged quantity.
 * FR-CAL-007: Manual food entry support.
 * FR-CAL-008: Quantity/unit validation and bounds enforcement.
 */
calorieLogsRouter.post('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }
    const body = createCalorieLogSchema.parse(req.body);

    let nutrition;
    let foodNameSnapshot = '';
    let source: 'catalog' | 'manual' = 'catalog';
    let foodObjectId: mongoose.Types.ObjectId | null = null;

    if (body.foodId) {
      const food = await Food.findById(body.foodId);
      if (!food) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'FOOD_NOT_FOUND',
            message: 'Catalog food item not found',
          },
        });
      }

      foodObjectId = food._id;
      foodNameSnapshot = food.name;
      source = 'catalog';

      nutrition = scaleNutrition({
        serving: food.serving,
        nutritionPerServing: food.nutritionPerServing,
        quantity: body.quantity,
        unit: body.unit,
        alternativeUnits: food.alternativeUnits,
      });
    } else if (body.manualFood) {
      foodNameSnapshot = body.manualFood.name;
      source = 'manual';

      // For manual foods, values represent 1 unit/serving of the entered food
      nutrition = {
        calories: Math.max(0, Math.round(body.manualFood.calories * body.quantity)),
        proteinG: Math.max(0, Math.round(body.manualFood.proteinG * body.quantity * 10) / 10),
        carbsG: Math.max(0, Math.round(body.manualFood.carbsG * body.quantity * 10) / 10),
        fatG: Math.max(0, Math.round(body.manualFood.fatG * body.quantity * 10) / 10),
        fiberG:
          body.manualFood.fiberG !== null && body.manualFood.fiberG !== undefined
            ? Math.max(0, Math.round(body.manualFood.fiberG * body.quantity * 10) / 10)
            : null,
      };
    } else {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_FOOD_SOURCE',
          message: 'Either foodId or manualFood must be specified',
        },
      });
    }

    const newLog = await CalorieLog.create({
      userId,
      date: body.date,
      mealType: body.mealType,
      foodId: foodObjectId,
      foodNameSnapshot,
      quantity: body.quantity,
      unit: body.unit,
      nutrition,
      source,
    });

    res.status(201).json({
      success: true,
      data: {
        log: {
          id: newLog._id.toString(),
          date: newLog.date,
          mealType: newLog.mealType,
          foodId: newLog.foodId ? newLog.foodId.toString() : null,
          foodNameSnapshot: newLog.foodNameSnapshot,
          quantity: newLog.quantity,
          unit: newLog.unit,
          nutrition: newLog.nutrition,
          source: newLog.source,
          createdAt: newLog.createdAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/calorie-logs?date=YYYY-MM-DD
 * FR-CAL-004: Daily target, consumed, and remaining calories.
 * FR-CAL-006: Historical daily calorie log retrieval.
 * FR-CAL-009: Daily macro totals (protein, carbohydrates, fat).
 */
calorieLogsRouter.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }
    const query = getCalorieLogsQuerySchema.parse(req.query);

    const targetDate = query.date || new Date().toISOString().split('T')[0];

    // Fetch user for target budget
    const user = await User.findById(userId);
    let targetCalories = 2200;
    if (user?.profile?.weightKg && user?.profile?.heightCm) {
      const isMale = user.profile.sex === 'male';
      const bmr =
        10 * user.profile.weightKg + 6.25 * user.profile.heightCm - 5 * 28 + (isMale ? 5 : -161);
      const activityMult =
        user.profile.activityLevel === 'sedentary'
          ? 1.2
          : user.profile.activityLevel === 'light'
          ? 1.375
          : user.profile.activityLevel === 'moderate'
          ? 1.55
          : 1.725;
      targetCalories = Math.round(bmr * activityMult);
      if (user.profile.goal === 'lose_weight') targetCalories -= 400;
      else if (user.profile.goal === 'gain_weight') targetCalories += 400;
    }

    // Fetch user's logs for that specific day
    const logs = await CalorieLog.find({ userId, date: targetDate })
      .sort({ createdAt: 1 })
      .lean();

    const summary = calculateDaySummary(
      targetDate,
      targetCalories,
      logs.map((l) => ({
        mealType: l.mealType,
        nutrition: l.nutrition,
      }))
    );

    res.json({
      success: true,
      data: {
        date: targetDate,
        summary,
        logs: logs.map((l) => ({
          id: l._id.toString(),
          date: l.date,
          mealType: l.mealType,
          foodId: l.foodId ? l.foodId.toString() : null,
          foodNameSnapshot: l.foodNameSnapshot,
          quantity: l.quantity,
          unit: l.unit,
          nutrition: l.nutrition,
          source: l.source,
          createdAt: l.createdAt,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/v1/calorie-logs/:id
 * FR-CAL-005: Edit a calorie-log entry.
 */
calorieLogsRouter.patch('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ID', message: 'Invalid calorie log identifier' },
      });
    }

    const updates = updateCalorieLogSchema.parse(req.body);

    const log = await CalorieLog.findById(id);
    if (!log) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Calorie log not found' },
      });
    }

    // Strict ownership verification
    if (log.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied to this log entry' },
      });
    }

    if (updates.mealType) {
      log.mealType = updates.mealType;
    }
    if (updates.foodNameSnapshot) {
      log.foodNameSnapshot = updates.foodNameSnapshot;
    }

    // If quantity or unit has changed, recalculate nutrition
    const newQuantity = updates.quantity ?? log.quantity;
    const newUnit = updates.unit ?? log.unit;

    if (updates.quantity !== undefined || updates.unit !== undefined) {
      if (log.foodId && log.source === 'catalog') {
        const food = await Food.findById(log.foodId);
        if (food) {
          log.nutrition = scaleNutrition({
            serving: food.serving,
            nutritionPerServing: food.nutritionPerServing,
            quantity: newQuantity,
            unit: newUnit,
            alternativeUnits: food.alternativeUnits,
          });
        }
      } else {
        // For manual entries, re-scale proportional to previous quantity
        const oldQty = log.quantity || 1;
        const ratio = newQuantity / oldQty;
        log.nutrition = {
          calories: Math.max(0, Math.round(log.nutrition.calories * ratio)),
          proteinG: Math.max(0, Math.round(log.nutrition.proteinG * ratio * 10) / 10),
          carbsG: Math.max(0, Math.round(log.nutrition.carbsG * ratio * 10) / 10),
          fatG: Math.max(0, Math.round(log.nutrition.fatG * ratio * 10) / 10),
          fiberG:
            log.nutrition.fiberG !== null
              ? Math.max(0, Math.round(log.nutrition.fiberG * ratio * 10) / 10)
              : null,
        };
      }
      log.quantity = newQuantity;
      log.unit = newUnit;
    }

    await log.save();

    res.json({
      success: true,
      data: {
        log: {
          id: log._id.toString(),
          date: log.date,
          mealType: log.mealType,
          foodId: log.foodId ? log.foodId.toString() : null,
          foodNameSnapshot: log.foodNameSnapshot,
          quantity: log.quantity,
          unit: log.unit,
          nutrition: log.nutrition,
          source: log.source,
          updatedAt: log.updatedAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/calorie-logs/:id
 * FR-CAL-005: Delete a calorie-log entry.
 */
calorieLogsRouter.delete('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ID', message: 'Invalid calorie log identifier' },
      });
    }

    const log = await CalorieLog.findById(id);
    if (!log) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Calorie log not found' },
      });
    }

    // Strict ownership verification
    if (log.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied to this log entry' },
      });
    }

    await log.deleteOne();

    res.json({
      success: true,
      message: 'Calorie log entry deleted successfully',
      data: { id },
    });
  } catch (error) {
    next(error);
  }
});
