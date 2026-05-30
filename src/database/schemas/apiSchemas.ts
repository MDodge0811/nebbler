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
 * Schema for API error responses.
 */
export const ApiErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
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
