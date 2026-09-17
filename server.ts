import express from 'express';
import path from 'path';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { connectDatabase } from './server/src/config/db';
import { errorHandler } from './server/src/middleware/errorHandler';
import { requestIdMiddleware } from './server/src/middleware/requestId';
import { healthRouter } from './server/src/routes/health';
import { authRouter } from './server/src/routes/auth';
import { usersRouter } from './server/src/routes/users';
import { bmiRouter } from './server/src/routes/bmi';
import { foodsRouter } from './server/src/routes/foods';
import { calorieLogsRouter } from './server/src/routes/calorieLogs';
import { dietPlansRouter } from './server/src/routes/dietPlans';

dotenv.config();

const PORT = 3000;

async function startServer() {
  const app = express();

  // Basic security and parsing middlewares
  app.use(requestIdMiddleware);
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  // Connect to MongoDB if MONGODB_URI is provided
  connectDatabase();

  // Primary REST API routes
  app.use('/api/v1/health', healthRouter);
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/users', usersRouter);
  app.use('/api/v1/bmi', bmiRouter);
  app.use('/api/v1/foods', foodsRouter);
  app.use('/api/v1/calorie-logs', calorieLogsRouter);
  app.use('/api/v1/diet-plans', dietPlansRouter);

  // Centralized Error Handling for API routes
  app.use(errorHandler);

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const clientUrl = process.env.CLIENT_URL || `http://localhost:${PORT}`;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NutriPulse backend server running on: http://localhost:${PORT}`);
    console.log(`Client URL configured for frontend: ${clientUrl}`);
  });
}

startServer();
