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
    let retryAfter = 60;
    try {
      const body = (await response.json()) as { retry_after_seconds?: number };
      if (typeof body.retry_after_seconds === 'number') {
        retryAfter = body.retry_after_seconds;
      }
    } catch {
      // Use fallback
    }
    throw new RateLimitedError(retryAfter);
  }

  throw new Error(`User search failed with status ${response.status}`);
}
