import { Router } from 'express';
import { AnalyticsController } from './analytics.controller.js';
import { authenticate, requireRole } from '../../middleware/auth.middleware.js';

export const createAnalyticsRouter = (): Router => {
  const router = Router();
  const controller = new AnalyticsController();

  router.use(authenticate);
  router.use(requireRole('ADMIN'));

  router.get('/dashboard', controller.getDashboardSummary);
  router.get('/assignments', controller.getAssignmentAnalytics);
  router.get('/groups', controller.getGroupAnalytics);
  router.get('/students', controller.getStudentAnalytics);

  return router;
};
