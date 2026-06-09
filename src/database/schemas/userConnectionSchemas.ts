import { z } from 'zod';

/**
 * Read-only synced row for `user_connections` (the contract's normalized pair).
 * Clients NEVER write this table — all mutations are online REST (FE-2). The
 * pair is normalized server-side (`user_a_id < user_b_id`); direction is not
 * meaningful. `deleted_at` is never synced — removal manifests as the row
 * leaving the bucket, so there is no soft-delete field or input schema here.
 */
export const UserConnectionSchema = z.object({
  id: z.string().uuid(),
  user_a_id: z.string().uuid(),
  user_b_id: z.string().uuid(),
  inserted_at: z.string(),
  updated_at: z.string(),
});

export type UserConnection = z.infer<typeof UserConnectionSchema>;
