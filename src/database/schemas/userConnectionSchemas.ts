import { z } from 'zod';

export const ConnectionStatusSchema = z.enum(['pending', 'accepted', 'declined', 'blocked']);

/**
 * Full row shape for a user_connections record as synced from PowerSync.
 */
export const UserConnectionSchema = z.object({
  id: z.string().uuid(),
  requester_id: z.string().uuid(),
  addressee_id: z.string().uuid(),
  status: ConnectionStatusSchema,
  blocker_id: z.string().uuid().nullable(),
  deleted_at: z.string().nullable(),
  inserted_at: z.string(),
  updated_at: z.string(),
});

/**
 * Minimal insert payload for creating a new connection request.
 * Only 'pending' is allowed as an initial status.
 */
export const CreateUserConnectionInputSchema = z.object({
  id: z.string().uuid(),
  requester_id: z.string().uuid(),
  addressee_id: z.string().uuid(),
  status: z.literal('pending'),
});

/**
 * Partial update payload for an existing connection record.
 */
export const UpdateUserConnectionInputSchema = z.object({
  status: ConnectionStatusSchema.optional(),
  blocker_id: z.string().uuid().nullable().optional(),
  deleted_at: z.string().nullable().optional(),
});

export type ConnectionStatus = z.infer<typeof ConnectionStatusSchema>;
export type UserConnection = z.infer<typeof UserConnectionSchema>;
