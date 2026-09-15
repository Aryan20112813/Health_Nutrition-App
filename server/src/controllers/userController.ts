import { Response, NextFunction } from 'express';
import { User } from '../models/User';
import { updateProfileSchema } from '../validators/auth';
import { AuthenticatedRequest } from '../middleware/auth';

export async function getMe(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user?.userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        user,
      },
      message: 'User profile retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function updateMe(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user?.userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    const validated = updateProfileSchema.parse(req.body);

    const user = await User.findById(req.user.userId);
    if (!user) {
      res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' },
      });
      return;
    }

    // Update profile fields
    if (validated.displayName !== undefined) user.profile.displayName = validated.displayName;
    if (validated.dateOfBirth !== undefined) user.profile.dateOfBirth = new Date(validated.dateOfBirth);
    if (validated.sex !== undefined) user.profile.sex = validated.sex;
    if (validated.heightCm !== undefined) user.profile.heightCm = validated.heightCm;
    if (validated.weightKg !== undefined) user.profile.weightKg = validated.weightKg;
    if (validated.goal !== undefined) user.profile.goal = validated.goal;
    if (validated.activityLevel !== undefined) user.profile.activityLevel = validated.activityLevel;
    if (validated.fitnessLevel !== undefined) user.profile.fitnessLevel = validated.fitnessLevel;

    // Update preferences fields
    if (validated.dietaryPreference !== undefined) user.preferences.dietaryPreference = validated.dietaryPreference;
    if (validated.restrictions !== undefined) user.preferences.restrictions = validated.restrictions;
    if (validated.excludedFoods !== undefined) user.preferences.excludedFoods = validated.excludedFoods;
    if (validated.equipment !== undefined) user.preferences.equipment = validated.equipment;
    if (validated.workoutDurationMin !== undefined) user.preferences.workoutDurationMin = validated.workoutDurationMin;
    if (validated.mealsPerDay !== undefined) user.preferences.mealsPerDay = validated.mealsPerDay;

    await user.save();

    res.status(200).json({
      success: true,
      data: {
        user,
      },
      message: 'Profile updated successfully',
    });
  } catch (error) {
    next(error);
  }
}
