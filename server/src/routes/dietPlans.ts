import { Router, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { DietPlan } from '../models/DietPlan';
import {
  generateDietPlanForUser,
  replaceMealInPlan,
  logPlanMealToCalorieTracker,
} from '../services/dietPlannerService';
import { replaceMealSchema, logPlanMealSchema } from '../validators/dietPlan';

export const dietPlansRouter = Router();

dietPlansRouter.use(requireAuth);

/**
 * GET /api/v1/diet-plans/current
 * FR-DIET-003, FR-DIET-006: Read current personalized diet plan or generate initial one.
 */
dietPlansRouter.get('/current', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    let plan: any = await DietPlan.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      status: 'current',
    }).sort({ generatedAt: -1 });

    if (!plan) {
      plan = await generateDietPlanForUser(userId);
    }

    res.json({
      success: true,
      data: {
        plan: {
          id: plan._id.toString(),
          goal: plan.goal,
          estimatedCalorieTarget: plan.estimatedCalorieTarget,
          nutritionTarget: plan.nutritionTarget,
          preferencesSnapshot: plan.preferencesSnapshot,
          meals: plan.meals.map((m) => ({
            id: m._id.toString(),
            mealType: m.mealType,
            title: m.title,
            description: m.description,
            foods: m.foods,
            totals: m.totals,
          })),
          generatedAt: plan.generatedAt,
          disclaimer:
            'Informational estimates only. Calorie targets and diet guidance are calculated wellness estimates and do not constitute medical advice.',
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/diet-plans/generate
 * FR-DIET-002, FR-DIET-003: Generate a new current diet plan based on current user profile and preferences.
 */
dietPlansRouter.post('/generate', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    const newPlan = await generateDietPlanForUser(userId);

    res.status(201).json({
      success: true,
      message: 'New personalized diet plan generated successfully',
      data: {
        plan: {
          id: newPlan._id.toString(),
          goal: newPlan.goal,
          estimatedCalorieTarget: newPlan.estimatedCalorieTarget,
          nutritionTarget: newPlan.nutritionTarget,
          preferencesSnapshot: newPlan.preferencesSnapshot,
          meals: newPlan.meals.map((m) => ({
            id: m._id.toString(),
            mealType: m.mealType,
            title: m.title,
            description: m.description,
            foods: m.foods,
            totals: m.totals,
          })),
          generatedAt: newPlan.generatedAt,
          disclaimer:
            'Informational estimates only. Calorie targets and diet guidance are calculated wellness estimates and do not constitute medical advice.',
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/diet-plans/:planId/replace-meal
 * FR-DIET-004: Replace a meal in the current plan with a compatible alternative option.
 */
dietPlansRouter.post('/:planId/replace-meal', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }
    const { planId } = req.params;
    const body = replaceMealSchema.parse(req.body);

    const updatedPlan = await replaceMealInPlan(userId, planId, body.mealType);

    res.json({
      success: true,
      message: 'Meal replaced with compatible alternative option',
      data: {
        plan: {
          id: updatedPlan._id.toString(),
          goal: updatedPlan.goal,
          estimatedCalorieTarget: updatedPlan.estimatedCalorieTarget,
          nutritionTarget: updatedPlan.nutritionTarget,
          meals: updatedPlan.meals.map((m) => ({
            id: m._id.toString(),
            mealType: m.mealType,
            title: m.title,
            description: m.description,
            foods: m.foods,
            totals: m.totals,
          })),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/diet-plans/:planId/meals/:mealId/log
 * FR-DIET-005: Log selected plan meal directly into daily calorie tracker.
 */
dietPlansRouter.post('/:planId/meals/:mealId/log', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }
    const { planId, mealId } = req.params;
    const body = logPlanMealSchema.parse(req.body || {});

    const result = await logPlanMealToCalorieTracker(userId, planId, mealId, body.date);

    res.status(201).json({
      success: true,
      message: `Successfully logged ${result.loggedCount} items from plan meal to ${result.mealType}`,
      data: {
        loggedCount: result.loggedCount,
        mealType: result.mealType,
      },
    });
  } catch (error) {
    next(error);
  }
});
