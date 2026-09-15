import { Router } from 'express';
import { createBmiRecord, getBmiRecords } from '../controllers/bmiController';
import { requireAuth } from '../middleware/auth';

export const bmiRouter = Router();

// Protected BMI endpoints (FR-BMI-001 to FR-BMI-004)
bmiRouter.post('/records', requireAuth as any, createBmiRecord as any);
bmiRouter.get('/records', requireAuth as any, getBmiRecords as any);
