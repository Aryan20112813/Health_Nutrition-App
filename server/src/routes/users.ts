import { Router } from 'express';
import { getMe, updateMe } from '../controllers/userController';
import { requireAuth } from '../middleware/auth';

export const usersRouter = Router();

// Protected profile routes
usersRouter.get('/me', requireAuth as any, getMe as any);
usersRouter.patch('/me', requireAuth as any, updateMe as any);
