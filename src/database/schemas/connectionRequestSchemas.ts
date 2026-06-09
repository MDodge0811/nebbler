import { z } from 'zod';

import { BasicUserSchema } from './apiSchemas';

/**
 * The created request returned by POST /api/connection-requests (201).
 * Tolerant: extra keys are stripped, since the full body is not pinned by the
 * contract. Adjust if the backend (NEB-138) returns a richer/leaner shape.
 */
export const ConnectionRequestSchema = z.object({
  id: z.string().uuid(),
  requested_at: z.string(),
});

export type ConnectionRequest = z.infer<typeof ConnectionRequestSchema>;

/**
 * One item in either direction of GET /api/connection-requests. `user` is the
 * *other* party (requestor for incoming, requestee for outgoing).
 */
export const ConnectionRequestItemSchema = z.object({
  id: z.string().uuid(),
  user: BasicUserSchema,
  requested_at: z.string(),
});

export type ConnectionRequestItem = z.infer<typeof ConnectionRequestItemSchema>;

/**
 * GET /api/connection-requests — pending requests, pre-split by direction.
 */
export const ConnectionRequestListResponseSchema = z.object({
  incoming: z.array(ConnectionRequestItemSchema),
  outgoing: z.array(ConnectionRequestItemSchema),
});

export type ConnectionRequestListResponse = z.infer<typeof ConnectionRequestListResponseSchema>;
