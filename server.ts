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

  // Centralized Error Handling
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NutriPulse server running on http://localhost:${PORT}`);
  });
}

startServer();
