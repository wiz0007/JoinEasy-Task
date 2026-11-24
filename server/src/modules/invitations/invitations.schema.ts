import { z } from 'zod';

export const createInvitationSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, 'Email or student ID is required'),
});

export const invitationIdParamSchema = z.object({
  invitationId: z.string().uuid('Invalid invitation ID format'),
});

export const groupInvitationParamSchema = z.object({
  groupId: z.string().uuid('Invalid group ID format'),
  invitationId: z.string().uuid('Invalid invitation ID format'),
});

export type CreateInvitationDto = z.infer<typeof createInvitationSchema>;
