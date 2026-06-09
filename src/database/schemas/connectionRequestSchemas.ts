import { z } from 'zod';

import { BasicUserSchema } from './apiSchemas';

/**
 * The single created/resolved request returned by POST /api/connection-requests
 * (201) and PATCH /api/connection-requests/:id (200), wrapped in
 * `connection_request`. Matches the live BE shape.
 */
export const ConnectionRequestSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['pending', 'accepted', 'declined', 'cancelled']),
  direction: z.enum(['incoming', 'outgoing']),
  other_user_id: z.string().uuid(),
  requestor_id: z.string().uuid(),
  requestee_id: z.string().uuid(),
  completed_at: z.string().nullable(),
  inserted_at: z.string(),
});

export type ConnectionRequest = z.infer<typeof ConnectionRequestSchema>;

// POST /api/connection-requests (201) and PATCH (200) wrap the request.
export const ConnectionRequestEnvelopeSchema = z.object({
  connection_request: ConnectionRequestSchema,
});

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
