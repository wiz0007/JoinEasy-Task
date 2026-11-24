import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { errorHandler } from './middleware/error.middleware.js';
import { createAuthRouter } from './modules/auth/auth.routes.js';
import { createGroupsRouter } from './modules/groups/groups.routes.js';
import {
  createInvitationsRouter,
  createGroupInvitationsRouter,
} from './modules/invitations/invitations.routes.js';
import { createAssignmentsRouter } from './modules/assignments/assignments.routes.js';
import {
  createSubmissionsRouter,
  createGroupSubmissionsRouter,
} from './modules/submissions/submissions.routes.js';
import { createAnalyticsRouter } from './modules/analytics/analytics.routes.js';

export const createApp = (): Express => {
  const app = express();

  // Security middlewares
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, or same-origin)
        if (!origin) return callback(null, true);

        const allowed = [
          env.CLIENT_ORIGIN,
          'http://localhost:5173',
          'http://127.0.0.1:5173',
        ];

        if (
          allowed.includes(origin) ||
          origin.endsWith('.vercel.app') ||
          origin.endsWith('.onrender.com') ||
          process.env.NODE_ENV !== 'production'
        ) {
          return callback(null, true);
        }

        return callback(null, true);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  app.use(cookieParser(env.COOKIE_SECRET));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Rate limiter for authentication endpoints
  const authLimiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX_REQUESTS,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many authentication attempts, please try again later.',
    },
  });

  // Healthcheck endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Mount API v1 routes
  const apiRouter = express.Router();

  apiRouter.use('/auth', authLimiter, createAuthRouter());
  apiRouter.use('/groups', createGroupsRouter());
  apiRouter.use('/groups', createGroupInvitationsRouter());
  apiRouter.use('/groups', createGroupSubmissionsRouter());
  apiRouter.use('/invitations', createInvitationsRouter());
  apiRouter.use('/assignments', createAssignmentsRouter());
  apiRouter.use('/assignments', createSubmissionsRouter());
  apiRouter.use('/admin/analytics', createAnalyticsRouter());

  app.use('/api/v1', apiRouter);

  // 404 handler for unhandled routes
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      message: 'Endpoint not found',
    });
  });

  // Centralized Error Handling Middleware
  app.use(errorHandler);

  return app;
};
