import { Router } from 'express';
import { SubmissionsController } from './submissions.controller.js';
import { validateRequest } from '../../middleware/validation.middleware.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import {
  confirmSubmissionParamsSchema,
  groupParamsSchema,
} from './submissions.schema.js';

export const createSubmissionsRouter = (): Router => {
  const router = Router();
  const controller = new SubmissionsController();

  router.use(authenticate);

  // Confirm submission: POST /api/v1/assignments/:assignmentId/groups/:groupId/confirm
  router.post(
    '/:assignmentId/groups/:groupId/confirm',
    validateRequest({ params: confirmSubmissionParamsSchema }),
    controller.confirm
  );

  // Get specific submission: GET /api/v1/assignments/:assignmentId/groups/:groupId/submission
  router.get(
    '/:assignmentId/groups/:groupId/submission',
    validateRequest({ params: confirmSubmissionParamsSchema }),
    controller.getSubmission
  );

  return router;
};

export const createGroupSubmissionsRouter = (): Router => {
  const router = Router();
  const controller = new SubmissionsController();

  router.use(authenticate);

  // Get group progress: GET /api/v1/groups/:groupId/progress
  router.get(
    '/:groupId/progress',
    validateRequest({ params: groupParamsSchema }),
    controller.getGroupProgress
  );

  // Get all submissions for a group: GET /api/v1/groups/:groupId/submissions
  router.get(
    '/:groupId/submissions',
    validateRequest({ params: groupParamsSchema }),
    controller.getGroupSubmissions
  );

  return router;
};
