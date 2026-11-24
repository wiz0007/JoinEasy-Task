import { z } from 'zod';

export const confirmSubmissionParamsSchema = z.object({
  assignmentId: z.string().uuid('Invalid assignment ID format'),
  groupId: z.string().uuid('Invalid group ID format'),
});

export const groupParamsSchema = z.object({
  groupId: z.string().uuid('Invalid group ID format'),
});
