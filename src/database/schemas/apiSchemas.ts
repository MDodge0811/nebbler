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
 * Schema for a single user result from the user-search endpoint.
 * avatar_color regex is case-insensitive to accept both #00DB74 and #00db74.
 */
export const UserSearchResultSchema = z.object({
  id: z.string().uuid(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  avatar_color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .nullable(),
});

/**
 * Schema for the full response from GET /api/users/search.
 */
export const UserSearchResponseSchema = z.array(UserSearchResultSchema);

export type UserSearchResult = z.infer<typeof UserSearchResultSchema>;
