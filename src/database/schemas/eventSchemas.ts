import { z } from 'zod';

/**
 * Validation schema for the Create Event form.
 */
export const CreateEventSchema = z
  .object({
    title: z.string().min(1, 'Title is required'),
    calendarId: z.string().min(1, 'Select a calendar'),
    startTime: z.date(),
    endTime: z.date(),
    description: z.string().optional(),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: 'End time must be after start time',
    path: ['endTime'],
  });

export type CreateEventFormData = z.infer<typeof CreateEventSchema>;
