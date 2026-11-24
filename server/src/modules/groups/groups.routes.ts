import { Router } from 'express';
import { GroupsController } from './groups.controller.js';
import { validateRequest } from '../../middleware/validation.middleware.js';
import { authenticate, requireRole } from '../../middleware/auth.middleware.js';
import {
  createGroupSchema,
  updateGroupSchema,
  groupIdParamSchema,
  removeMemberParamSchema,
} from './groups.schema.js';

export const createGroupsRouter = (): Router => {
  const router = Router();
  const controller = new GroupsController();

  router.use(authenticate);

  // Student can create group
  router.post(
    '/',
    requireRole('STUDENT'),
    validateRequest({ body: createGroupSchema }),
    controller.create
  );

  // Student get current user's group
  router.get('/me', requireRole('STUDENT'), controller.getMyGroup);

  // Admin list all active groups
  router.get('/all', requireRole('ADMIN'), controller.listAll);

  // Get specific group by ID
  router.get(
    '/:groupId',
    validateRequest({ params: groupIdParamSchema }),
    controller.getById
  );

  // Group owner update group name
  router.patch(
    '/:groupId',
    requireRole('STUDENT'),
    validateRequest({ params: groupIdParamSchema, body: updateGroupSchema }),
    controller.update
  );

  // Group owner remove a member
  router.delete(
    '/:groupId/members/:userId',
    requireRole('STUDENT'),
    validateRequest({ params: removeMemberParamSchema }),
    controller.removeMember
  );

  return router;
};
