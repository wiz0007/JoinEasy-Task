import { Router } from 'express';
import { InvitationsController } from './invitations.controller.js';
import { validateRequest } from '../../middleware/validation.middleware.js';
import { authenticate, requireRole } from '../../middleware/auth.middleware.js';
import {
  createInvitationSchema,
  invitationIdParamSchema,
  groupInvitationParamSchema,
} from './invitations.schema.js';
import { groupIdParamSchema } from '../groups/groups.schema.js';

export const createInvitationsRouter = (): Router => {
  const router = Router();
  const controller = new InvitationsController();

  router.use(authenticate);

  // Group owner invites a student: POST /api/v1/groups/:groupId/invitations
  // Handled here or mounted appropriately

  // Student views their invitations: GET /api/v1/invitations/me
  router.get('/me', requireRole('STUDENT'), controller.getMyInvitations);

  // Student accepts an invitation: POST /api/v1/invitations/:invitationId/accept
  router.post(
    '/:invitationId/accept',
    requireRole('STUDENT'),
    validateRequest({ params: invitationIdParamSchema }),
    controller.accept
  );

  // Student rejects an invitation: POST /api/v1/invitations/:invitationId/reject
  router.post(
    '/:invitationId/reject',
    requireRole('STUDENT'),
    validateRequest({ params: invitationIdParamSchema }),
    controller.reject
  );

  return router;
};

export const createGroupInvitationsRouter = (): Router => {
  const router = Router();
  const controller = new InvitationsController();

  router.use(authenticate);

  // Group owner invites a student to group: POST /api/v1/groups/:groupId/invitations
  router.post(
    '/:groupId/invitations',
    requireRole('STUDENT'),
    validateRequest({ params: groupIdParamSchema, body: createInvitationSchema }),
    controller.create
  );

  // Group owner cancels invitation: DELETE /api/v1/groups/:groupId/invitations/:invitationId
  router.delete(
    '/:groupId/invitations/:invitationId',
    requireRole('STUDENT'),
    validateRequest({ params: groupInvitationParamSchema }),
    controller.cancel
  );

  return router;
};
