import { Router } from 'express';
import { AssignmentsController } from './assignments.controller.js';
import { validateRequest } from '../../middleware/validation.middleware.js';
import { authenticate, requireRole } from '../../middleware/auth.middleware.js';
import {
  createAssignmentSchema,
  updateAssignmentSchema,
  assignmentIdParamSchema,
} from './assignments.schema.js';

export const createAssignmentsRouter = (): Router => {
  const router = Router();
  const controller = new AssignmentsController();

  router.use(authenticate);

  // List assignments (role-aware visibility)
  router.get('/', controller.list);

  // Get assignment by ID (authorized access)
  router.get(
    '/:assignmentId',
    validateRequest({ params: assignmentIdParamSchema }),
    controller.getById
  );

  // Admin: Create assignment
  router.post(
    '/',
    requireRole('ADMIN'),
    validateRequest({ body: createAssignmentSchema }),
    controller.create
  );

  // Admin: Update assignment
  router.patch(
    '/:assignmentId',
    requireRole('ADMIN'),
    validateRequest({ params: assignmentIdParamSchema, body: updateAssignmentSchema }),
    controller.update
  );

  return router;
};
