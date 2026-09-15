import { Router } from 'express';
import {
  register,
  login,
  refresh,
  logout,
  changePassword,
} from '../controllers/authController';
import { requireAuth } from '../middleware/auth';

export const authRouter = Router();

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/refresh', refresh);
authRouter.post('/logout', logout);
authRouter.patch('/password', requireAuth as any, changePassword as any);
