import { powersyncConfig } from '@constants/config';
import { getApiToken } from '@database/index';
import { UserSearchResponseSchema, type UserSearchResult } from '@database/schemas';

/**
 * Thrown when the search API responds with HTTP 429 (Too Many Requests).
 * The caller should back off for at least `retryAfterSeconds`.
 */
export class RateLimitedError extends Error {
  retryAfterSeconds: number;

  constructor(retryAfterSeconds: number) {
    super(`Rate limited — retry after ${retryAfterSeconds}s`);
    this.name = 'RateLimitedError';
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

/**
 * Search for users by name or email fragment.
 *
 * Returns an empty array immediately (without an API call) when the trimmed
 * query is shorter than 2 characters.
 *
 * @throws {RateLimitedError} When the server returns HTTP 429.
 * @throws {Error} When the user is not authenticated, or on unexpected non-2xx responses.
 */
export async function searchUsers(query: string): Promise<UserSearchResult[]> {
  const trimmed = query.trim();

  if (trimmed.length < 2) {
    return [];
  }

  const token = await getApiToken();
  if (!token) {
    throw new Error('User not signed in — cannot search users');
  }

  const url = `${powersyncConfig.backendUrl}/api/users/search?q=${encodeURIComponent(trimmed)}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.ok) {
    const body: unknown = await response.json();
    return UserSearchResponseSchema.parse(body);
  }

  if (response.status === 400) {
    return [];
  }

  if (response.status === 429) {
    // The backend conveys the retry hint via the standard `Retry-After` header
    // (seconds); the body is the canonical error envelope and no longer carries
    // `retry_after_seconds`. Fall back to 60s when the header is absent/invalid.
    const header = response.headers.get('Retry-After');
    const parsed = header ? Number.parseInt(header, 10) : Number.NaN;
    const retryAfter = Number.isFinite(parsed) && parsed > 0 ? parsed : 60;
    throw new RateLimitedError(retryAfter);
  }

  throw new Error(`User search failed with status ${response.status}`);
}
