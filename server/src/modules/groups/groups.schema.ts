import { z } from 'zod';

export const createGroupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Group name must be at least 2 characters')
    .max(100, 'Group name must not exceed 100 characters'),
});

export const updateGroupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Group name must be at least 2 characters')
    .max(100, 'Group name must not exceed 100 characters'),
});

export const groupIdParamSchema = z.object({
  groupId: z.string().uuid('Invalid group ID format'),
});

export const removeMemberParamSchema = z.object({
  groupId: z.string().uuid('Invalid group ID format'),
  userId: z.string().uuid('Invalid user ID format'),
});

export type CreateGroupDto = z.infer<typeof createGroupSchema>;
export type UpdateGroupDto = z.infer<typeof updateGroupSchema>;
