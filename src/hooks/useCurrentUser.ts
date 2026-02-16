import { useQuery } from '@powersync/react';
import { useAuth } from '@hooks/useAuth';
import type { User as DbUser } from '@database/schema';

/**
 * Queries the local PowerSync users table for the authenticated user's profile.
 *
 * The auth context provides id/email immediately, but first_name and
 * last_name come from the synced users table (may lag on first sync).
 * Consumers should handle `user === null` gracefully.
 */
export function useCurrentUser() {
  const { user: authUser } = useAuth();
  const userId = authUser?.id;

  const { data, isLoading, error } = useQuery<DbUser>(
    userId ? 'SELECT * FROM users WHERE id = ?' : 'SELECT * FROM users WHERE 0',
    userId ? [userId] : []
  );

  return {
    user: data?.[0] ?? null,
    authUser,
    isLoading,
    error,
  };
}
