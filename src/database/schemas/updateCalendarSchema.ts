import { z } from 'zod';

export const UpdateCalendarSchema = z.object({
  name: z.string().trim().min(1, 'Calendar name is required').max(100, 'Name is too long'),
  description: z.string().max(500, 'Description is too long').optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color')
    .optional(),
  rsvpEnabled: z.boolean().optional(),
  discoverable: z.boolean().optional(),
  affectsAvailability: z.boolean().optional(),
});

export type UpdateCalendarFormData = z.infer<typeof UpdateCalendarSchema>;
