import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { validateRequest } from '../../middleware/validation.middleware.js';
import { registerSchema, loginSchema, refreshTokenSchema } from './auth.schema.js';
import { authenticate } from '../../middleware/auth.middleware.js';

export const createAuthRouter = (): Router => {
  const router = Router();
  const controller = new AuthController();

  router.post('/register', validateRequest({ body: registerSchema }), controller.register);
  router.post('/login', validateRequest({ body: loginSchema }), controller.login);
  router.post('/refresh', validateRequest({ body: refreshTokenSchema }), controller.refresh);
  router.post('/logout', authenticate, controller.logout);
  router.get('/me', authenticate, controller.me);

  return router;
};
