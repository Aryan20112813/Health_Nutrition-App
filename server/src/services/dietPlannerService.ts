import mongoose from 'mongoose';
import { User, IUser } from '../models/User';
import { DietPlan, IDietPlan, IDietPlanMeal } from '../models/DietPlan';
import { Food, IFood } from '../models/Food';
import { CalorieLog } from '../models/CalorieLog';
import { seedFoodCatalogIfNeeded } from '../data/seedFoods';

export interface ICalorieTargetResult {
  bmr: number;
  tdee: number;
  estimatedTarget: number;
  macroTarget: {
    proteinG: number;
    carbsG: number;
    fatG: number;
  };
  formulaVersion: string;
}

/**
 * Calculates estimated daily calorie target using Mifflin-St Jeor formula,
 * activity level multiplier, and goal adjustment (FR-DIET-002).
 */
export function calculateEstimatedTarget(userProfile?: IUser['profile']): ICalorieTargetResult {
  const weightKg = userProfile?.weightKg || 70;
  const heightCm = userProfile?.heightCm || 170;
  const isMale = userProfile?.sex === 'male';
  const age = 28; // Standard default age for calculation if DOB not provided

  // Mifflin-St Jeor Equation
  const bmr = Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + (isMale ? 5 : -161));

  let activityMult = 1.375;
  switch (userProfile?.activityLevel) {
    case 'sedentary':
      activityMult = 1.2;
      break;
    case 'light':
      activityMult = 1.375;
      break;
    case 'moderate':
      activityMult = 1.55;
      break;
    case 'high':
      activityMult = 1.725;
      break;
  }

  const tdee = Math.round(bmr * activityMult);

  let goalAdjustment = 0;
  if (userProfile?.goal === 'lose_weight') {
    goalAdjustment = -400;
  } else if (userProfile?.goal === 'gain_weight') {
    goalAdjustment = 400;
  }

  // Safety clamping for general wellness (1200 - 4000 kcal)
  const estimatedTarget = Math.max(1200, Math.min(4000, Math.round(tdee + goalAdjustment)));

  // Standard balanced macronutrient distribution (25% protein, 50% carbs, 25% fat)
  const proteinG = Math.round((estimatedTarget * 0.25) / 4);
  const carbsG = Math.round((estimatedTarget * 0.50) / 4);
  const fatG = Math.round((estimatedTarget * 0.25) / 9);

  return {
    bmr,
    tdee,
    estimatedTarget,
    macroTarget: { proteinG, carbsG, fatG },
    formulaVersion: 'Mifflin-StJeor-v1',
  };
}

/**
 * Filter foods by user dietary preferences and restrictions.
 */
export function filterFoodsForUser(foods: IFood[], preference: string, restrictions: string[] = []): IFood[] {
  const normPref = (preference || 'omnivore').toLowerCase();
  const normRestrictions = restrictions.map((r) => r.toLowerCase().trim());

  return foods.filter((food) => {
    // Dietary preference filtering
    const tags = (food.dietaryTags || []).map((t) => t.toLowerCase());

    if (normPref === 'vegan' && !tags.includes('vegan')) return false;
    if (normPref === 'vegetarian' && !tags.includes('vegetarian') && !tags.includes('vegan')) return false;
    if (normPref === 'eggetarian' && !tags.includes('vegetarian') && !tags.includes('vegan') && !tags.includes('eggetarian')) return false;

    // Restriction filtering (e.g. dairy, gluten, peanut)
    if (normRestrictions.length > 0) {
      const foodTags = (food.tags || []).map((t) => t.toLowerCase());
      const foodName = food.name.toLowerCase();

      for (const restriction of normRestrictions) {
        if (foodTags.includes(restriction) || foodName.includes(restriction)) {
          return false;
        }
      }
    }

    return true;
  });
}

/**
 * Generates a rules-based deterministic diet plan for a user (FR-DIET-003).
 */
export async function generateDietPlanForUser(userId: string): Promise<IDietPlan> {
  const user = await User.findById(userId);
  const profile = user?.profile;
  const preferences = user?.preferences;

  const targetCalc = calculateEstimatedTarget(profile);
  const dietaryPreference = preferences?.dietaryPreference || 'vegetarian';
  const restrictions = preferences?.restrictions || [];

  // Ensure catalog is populated
  await seedFoodCatalogIfNeeded();
  const allFoods = await Food.find({ isActive: true }).lean();
  const suitableFoods = filterFoodsForUser(allFoods as IFood[], dietaryPreference, restrictions);

  const fallbackCatalog = suitableFoods.length > 0 ? suitableFoods : (allFoods as IFood[]);

  // Split target calories across 4 meal slots
  const slotBudgets = {
    breakfast: Math.round(targetCalc.estimatedTarget * 0.25),
    lunch: Math.round(targetCalc.estimatedTarget * 0.35),
    snack: Math.round(targetCalc.estimatedTarget * 0.15),
    dinner: Math.round(targetCalc.estimatedTarget * 0.25),
  };

  const mealSlots: ('breakfast' | 'lunch' | 'snack' | 'dinner')[] = ['breakfast', 'lunch', 'snack', 'dinner'];

  const meals: IDietPlanMeal[] = mealSlots.map((slot) => {
    const budget = slotBudgets[slot];

    // Pick 1-2 items matching the meal slot
    let slotCandidates = fallbackCatalog;

    if (slot === 'breakfast') {
      const bfast = fallbackCatalog.filter((f) =>
        f.tags.some((t) => ['breakfast', 'poha', 'idli', 'oats', 'chai', 'egg', 'fruits'].includes(t.toLowerCase()))
      );
      if (bfast.length > 0) slotCandidates = bfast;
    } else if (slot === 'snack') {
      const snacks = fallbackCatalog.filter((f) =>
        f.tags.some((t) => ['snack', 'nuts', 'fruit', 'salads', 'chai', 'starter'].includes(t.toLowerCase()))
      );
      if (snacks.length > 0) slotCandidates = snacks;
    } else {
      const mainMeals = fallbackCatalog.filter((f) =>
        f.tags.some((t) => ['roti', 'rice', 'dal', 'paneer', 'curry', 'chicken', 'soya'].includes(t.toLowerCase()))
      );
      if (mainMeals.length > 0) slotCandidates = mainMeals;
    }

    const primaryFood = slotCandidates[Math.floor(Math.random() * slotCandidates.length)];

    // Calculate portion multiplier to hit target slot calories
    const singleServCalories = Math.max(primaryFood.nutritionPerServing.calories, 30);
    const quantityMultiplier = Math.max(0.5, Math.round((budget / singleServCalories) * 10) / 10);

    const scaledCalories = Math.round(primaryFood.nutritionPerServing.calories * quantityMultiplier);
    const scaledProtein = Math.round(primaryFood.nutritionPerServing.proteinG * quantityMultiplier * 10) / 10;
    const scaledCarbs = Math.round(primaryFood.nutritionPerServing.carbsG * quantityMultiplier * 10) / 10;
    const scaledFat = Math.round(primaryFood.nutritionPerServing.fatG * quantityMultiplier * 10) / 10;

    const foodsInMeal = [
      {
        foodId: primaryFood._id,
        foodNameSnapshot: primaryFood.name,
        quantity: quantityMultiplier * primaryFood.serving.amount,
        unit: primaryFood.serving.unit,
        calories: scaledCalories,
        proteinG: scaledProtein,
        carbsG: scaledCarbs,
        fatG: scaledFat,
      },
    ];

    return {
      _id: new mongoose.Types.ObjectId(),
      mealType: slot,
      title: `${slot.charAt(0).toUpperCase() + slot.slice(1)}: ${primaryFood.name}`,
      description: `Targeting ~${budget} kcal based on your ${profile?.goal || 'health'} goal.`,
      foods: foodsInMeal,
      totals: {
        calories: scaledCalories,
        proteinG: scaledProtein,
        carbsG: scaledCarbs,
        fatG: scaledFat,
      },
    };
  });

  // Archive old active plans for user
  await DietPlan.updateMany({ userId: new mongoose.Types.ObjectId(userId), status: 'current' }, { status: 'archived' });

  // Create new active diet plan
  const newPlan = await DietPlan.create({
    userId: new mongoose.Types.ObjectId(userId),
    status: 'current',
    goal: profile?.goal || 'maintain',
    estimatedCalorieTarget: targetCalc.estimatedTarget,
    nutritionTarget: targetCalc.macroTarget,
    preferencesSnapshot: {
      dietaryPreference,
      restrictions,
      mealsPerDay: preferences?.mealsPerDay || 4,
    },
    meals,
    generatedAt: new Date(),
  });

  return newPlan;
}

/**
 * Replaces a meal in an existing active diet plan with a compatible alternative (FR-DIET-004).
 */
export async function replaceMealInPlan(userId: string, planId: string, mealType: string): Promise<IDietPlan> {
  const plan = await DietPlan.findOne({
    _id: planId,
    userId: new mongoose.Types.ObjectId(userId),
  });

  if (!plan) {
    throw new Error('Diet plan not found');
  }

  const mealIndex = plan.meals.findIndex((m) => m.mealType === mealType || m._id.toString() === mealType);
  if (mealIndex === -1) {
    throw new Error('Meal slot not found in plan');
  }

  const currentMeal = plan.meals[mealIndex];
  const targetCalories = currentMeal.totals.calories || 400;

  // Find candidate foods matching user preferences
  const allFoods = await Food.find({ isActive: true }).lean();
  const suitableFoods = filterFoodsForUser(
    allFoods as IFood[],
    plan.preferencesSnapshot.dietaryPreference,
    plan.preferencesSnapshot.restrictions
  );

  // Exclude foods already in current meal title/snapshot
  const currentName = currentMeal.foods[0]?.foodNameSnapshot || '';
  const altCandidates = suitableFoods.filter((f) => f.name !== currentName);
  const candidates = altCandidates.length > 0 ? altCandidates : suitableFoods;

  const newFood = candidates[Math.floor(Math.random() * candidates.length)];
  const singleServCalories = Math.max(newFood.nutritionPerServing.calories, 30);
  const quantityMultiplier = Math.max(0.5, Math.round((targetCalories / singleServCalories) * 10) / 10);

  const scaledCalories = Math.round(newFood.nutritionPerServing.calories * quantityMultiplier);
  const scaledProtein = Math.round(newFood.nutritionPerServing.proteinG * quantityMultiplier * 10) / 10;
  const scaledCarbs = Math.round(newFood.nutritionPerServing.carbsG * quantityMultiplier * 10) / 10;
  const scaledFat = Math.round(newFood.nutritionPerServing.fatG * quantityMultiplier * 10) / 10;

  plan.meals[mealIndex] = {
    _id: currentMeal._id,
    mealType: currentMeal.mealType,
    title: `${currentMeal.mealType.charAt(0).toUpperCase() + currentMeal.mealType.slice(1)}: ${newFood.name}`,
    description: `Replaced meal alternative (~${scaledCalories} kcal).`,
    foods: [
      {
        foodId: newFood._id,
        foodNameSnapshot: newFood.name,
        quantity: quantityMultiplier * newFood.serving.amount,
        unit: newFood.serving.unit,
        calories: scaledCalories,
        proteinG: scaledProtein,
        carbsG: scaledCarbs,
        fatG: scaledFat,
      },
    ],
    totals: {
      calories: scaledCalories,
      proteinG: scaledProtein,
      carbsG: scaledCarbs,
      fatG: scaledFat,
    },
  };

  await plan.save();
  return plan;
}

/**
 * Logs a selected plan meal directly into the daily calorie tracker (FR-DIET-005).
 */
export async function logPlanMealToCalorieTracker(
  userId: string,
  planId: string,
  mealId: string,
  dateString?: string
): Promise<{ loggedCount: number; mealType: string }> {
  const plan = await DietPlan.findOne({
    _id: planId,
    userId: new mongoose.Types.ObjectId(userId),
  });

  if (!plan) {
    throw new Error('Diet plan not found');
  }

  const meal = plan.meals.find((m) => m._id.toString() === mealId || m.mealType === mealId);
  if (!meal) {
    throw new Error('Meal slot not found in diet plan');
  }

  const logDate = dateString || new Date().toISOString().split('T')[0];
  const validMealType = (['breakfast', 'lunch', 'snack', 'dinner'].includes(meal.mealType)
    ? meal.mealType
    : 'lunch') as 'breakfast' | 'lunch' | 'snack' | 'dinner';

  // Create calorie logs for foods in the plan meal
  const logDocs = meal.foods.map((food) => ({
    userId: new mongoose.Types.ObjectId(userId),
    date: logDate,
    mealType: validMealType,
    foodId: food.foodId,
    foodNameSnapshot: food.foodNameSnapshot,
    quantity: food.quantity,
    unit: food.unit,
    nutrition: {
      calories: food.calories,
      proteinG: food.proteinG,
      carbsG: food.carbsG,
      fatG: food.fatG,
      fiberG: null,
    },
    source: 'catalog' as const,
  }));

  await CalorieLog.insertMany(logDocs);

  return { loggedCount: logDocs.length, mealType: validMealType };
}
