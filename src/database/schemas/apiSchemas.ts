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
