import { z } from 'zod';

/**
 * Schema for the fetchCredentials API response.
 * Validates the response from POST /api/powersync/auth.
 */
export const FetchCredentialsResponseSchema = z.object({
  token: z.string().min(1, 'Token must not be empty'),
  expiresAt: z.string().optional(),
});

export type FetchCredentialsResponse = z.infer<typeof FetchCredentialsResponseSchema>;

/**
 * Schema for the canonical API error envelope (NEB-147).
 *
 * Every error response from the backend — all status codes, including 401 and
 * 429 — uses this shape:
 *   { "error": { "code": "<stable>", "message": "<human>", "details"?: { field: [msg] } } }
 *
 * `code` is a stable machine string (e.g. "not_found", "forbidden",
 * "validation_failed", "rate_limited", "already_connected"). `details` is
 * present only on "validation_failed" (422) and maps each invalid field to its
 * messages. For 429, the retry hint is in the `Retry-After` response header,
 * not in the body.
 */
export const ApiErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.string(), z.array(z.string())).optional(),
  }),
});

export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;

/**
 * Relationship state between the current user and another user (the FE's core
 * mental model). Carried on every payload that returns another user.
 * Contract: connections-api-contract-be-fe.
 */
export const RelationshipStateSchema = z.enum([
  'none',
  'outgoing_pending',
  'incoming_pending',
  'connected',
]);

export type RelationshipState = z.infer<typeof RelationshipStateSchema>;

export const RelationshipSchema = z.object({
  state: RelationshipStateSchema,
  // present for *_pending (accept/decline/cancel); null otherwise
  request_id: z.string().uuid().nullable(),
  // present for connected (open profile); null otherwise. NOT a stable id —
  // re-connecting after a removal yields a new id (contract "Deletion model").
  connection_id: z.string().uuid().nullable(),
});

export type Relationship = z.infer<typeof RelationshipSchema>;

/**
 * Basic (public) user identity. Returned everywhere a user appears.
 * Email is NEVER part of this shape.
 */
export const BasicUserSchema = z.object({
  id: z.string().uuid(),
  username: z.string(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  avatar_color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .nullable(),
});

export type BasicUser = z.infer<typeof BasicUserSchema>;

/**
 * A single user result from GET /api/users/search — basic info + relationship.
 */
export const UserSearchResultSchema = BasicUserSchema.extend({
  relationship: RelationshipSchema,
});

export const UserSearchResponseSchema = z.array(UserSearchResultSchema);

export type UserSearchResult = z.infer<typeof UserSearchResultSchema>;

/**
 * GET /api/users/:id — basic info + relationship (same shape as a search result).
 */
export const UserProfileResponseSchema = BasicUserSchema.extend({
  relationship: RelationshipSchema,
});

export type UserProfileResponse = z.infer<typeof UserProfileResponseSchema>;
