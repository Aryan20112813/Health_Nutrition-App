import { Router, Request, Response } from 'express';
import { getDatabaseStatus } from '../config/db';

export const healthRouter = Router();

healthRouter.get('/', (_req: Request, res: Response) => {
  const dbStatus = getDatabaseStatus();

  res.status(200).json({
    success: true,
    data: {
      status: 'ok',
      service: 'NutriPulse Health & Metabolic OS API',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      database: dbStatus,
      environment: process.env.NODE_ENV || 'development',
    },
    message: 'System is healthy',
  });
});
