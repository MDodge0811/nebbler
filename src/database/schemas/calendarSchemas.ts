import { z } from 'zod';

/**
 * Validation schema for the Create Calendar form.
 */
export const CreateCalendarSchema = z.object({
  name: z.string().trim().min(1, 'Calendar name is required').max(100, 'Name is too long'),
  type: z.enum(['private', 'social']),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color')
    .optional(),
  groupId: z.string().uuid().nullable().optional(),
  affectsAvailability: z.boolean(),
  description: z.string().max(500, 'Description is too long').optional(),
});

export type CreateCalendarFormData = z.infer<typeof CreateCalendarSchema>;
