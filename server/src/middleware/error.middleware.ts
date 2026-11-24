import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/api-error.js';
import { env } from '../config/env.js';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
      ...(env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
    });
  }

  // Prisma known errors
  if ('code' in err && typeof (err as any).code === 'string') {
    const prismaErr = err as any;
    if (prismaErr.code === 'P2002') {
      const target = Array.isArray(prismaErr.meta?.target) ? prismaErr.meta.target.join(', ') : 'field';
      return res.status(409).json({
        success: false,
        message: `Unique constraint violation on ${target}`,
      });
    }
    if (prismaErr.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Record not found',
      });
    }
  }

  console.error('Unhandled server error:', err);

  return res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(env.NODE_ENV === 'development' ? { error: err.message, stack: err.stack } : {}),
  });
};
