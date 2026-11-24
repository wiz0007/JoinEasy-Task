import { z } from 'zod';

const httpsUrlRegex = /^https:\/\/[^\s$.?#].[^\s]*$/i;

export const createAssignmentSchema = z
  .object({
    title: z.string().trim().min(3, 'Title must be at least 3 characters').max(150),
    description: z.string().trim().min(5, 'Description must be at least 5 characters'),
    dueDate: z.string().datetime({ message: 'Due date must be a valid ISO 8601 date string' }),
    oneDriveUrl: z
      .string()
      .trim()
      .regex(httpsUrlRegex, 'OneDrive URL must be a valid HTTPS URL')
      .max(500),
    status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('PUBLISHED'),
    targetType: z.enum(['ALL_STUDENTS', 'SELECTED_GROUP']),
    targetGroupIds: z.array(z.string().uuid('Invalid group ID format')).optional().default([]),
  })
  .refine(
    (data) => {
      if (data.targetType === 'SELECTED_GROUP') {
        return Array.isArray(data.targetGroupIds) && data.targetGroupIds.length > 0;
      }
      return true;
    },
    {
      message: 'At least one target group must be selected when targeting selected groups',
      path: ['targetGroupIds'],
    }
  );

export const updateAssignmentSchema = z
  .object({
    title: z.string().trim().min(3).max(150).optional(),
    description: z.string().trim().min(5).optional(),
    dueDate: z.string().datetime().optional(),
    oneDriveUrl: z.string().trim().regex(httpsUrlRegex, 'OneDrive URL must be a valid HTTPS URL').optional(),
    status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
    targetType: z.enum(['ALL_STUDENTS', 'SELECTED_GROUP']).optional(),
    targetGroupIds: z.array(z.string().uuid()).optional(),
  })
  .refine(
    (data) => {
      if (data.targetType === 'SELECTED_GROUP') {
        return Array.isArray(data.targetGroupIds) && data.targetGroupIds.length > 0;
      }
      return true;
    },
    {
      message: 'At least one target group must be selected when target type is SELECTED_GROUP',
      path: ['targetGroupIds'],
    }
  );

export const assignmentIdParamSchema = z.object({
  assignmentId: z.string().uuid('Invalid assignment ID format'),
});

export type CreateAssignmentDto = z.infer<typeof createAssignmentSchema>;
export type UpdateAssignmentDto = z.infer<typeof updateAssignmentSchema>;
