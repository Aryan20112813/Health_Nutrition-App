import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { BmiRecord } from '../models/BmiRecord';
import { User } from '../models/User';
import { createBmiRecordSchema, getBmiRecordsQuerySchema } from '../validators/bmi';
import { analyzeBmi } from '../services/bmiService';

/**
 * POST /api/v1/bmi/records
 * Validates inputs, calculates BMI using weight(kg) / height(m)^2, categorizes,
 * stores record linked to authenticated user, and updates user profile height & weight.
 */
export async function createBmiRecord(
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

    const validated = createBmiRecordSchema.parse(req.body);
    const { heightCm, weightKg, recordedAt } = validated;

    // Calculate BMI & category deterministically
    const analysis = analyzeBmi(weightKg, heightCm);

    const recordDate = recordedAt ? new Date(recordedAt) : new Date();

    // Store record scoped to authenticated user
    const record = await BmiRecord.create({
      userId: req.user.userId,
      heightCm,
      weightKg,
      bmi: analysis.bmi,
      category: analysis.category,
      recordedAt: recordDate,
    });

    // Also update user's current height & weight on their profile
    await User.findByIdAndUpdate(req.user.userId, {
      $set: {
        'profile.heightCm': heightCm,
        'profile.weightKg': weightKg,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        record: {
          id: record._id,
          heightCm: record.heightCm,
          weightKg: record.weightKg,
          bmi: record.bmi,
          category: record.category,
          categoryLabel: analysis.categoryLabel,
          idealWeightRange: analysis.idealWeightRange,
          recordedAt: record.recordedAt,
          createdAt: record.createdAt,
        },
      },
      message: 'BMI record created successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/bmi/records
 * Returns own history, sorted by recordedAt descending, with pagination.
 * Scoped strictly to authenticated user.
 */
export async function getBmiRecords(
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

    const query = getBmiRecordsQuerySchema.parse(req.query);
    const { limit, page, startDate, endDate } = query;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {
      userId: req.user.userId,
    };

    if (startDate || endDate) {
      filter.recordedAt = {};
      if (startDate) {
        filter.recordedAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.recordedAt.$lte = new Date(endDate);
      }
    }

    const [records, total] = await Promise.all([
      BmiRecord.find(filter)
        .sort({ recordedAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      BmiRecord.countDocuments(filter),
    ]);

    const formattedRecords = records.map((r) => {
      const analysis = analyzeBmi(r.weightKg, r.heightCm);
      return {
        id: r._id,
        heightCm: r.heightCm,
        weightKg: r.weightKg,
        bmi: r.bmi,
        category: r.category,
        categoryLabel: analysis.categoryLabel,
        idealWeightRange: analysis.idealWeightRange,
        recordedAt: r.recordedAt,
        createdAt: r.createdAt,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        records: formattedRecords,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
      message: 'BMI history retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
}
