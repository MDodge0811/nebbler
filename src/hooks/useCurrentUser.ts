import { useQuery, usePowerSync } from '@powersync/react';
import { useCallback } from 'react';

import type { User as DbUser } from '@database/schema';
import { useAuth } from '@hooks/useAuth';

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
    user: data[0] ?? null,
    authUser,
    isLoading,
    error,
  };
}

/**
 * Mutations for the current user's `users` row. Keeps PowerSync writes in the
 * hook layer so screens never call `usePowerSync().execute()` directly.
 */
export function useCurrentUserMutations() {
  const powerSync = usePowerSync();

  const updateAvatarColor = useCallback(
    async (userId: string, hex: string): Promise<void> => {
      await powerSync.execute('UPDATE users SET avatar_color = ?, updated_at = ? WHERE id = ?', [
        hex.toUpperCase(),
        new Date().toISOString(),
        userId,
      ]);
    },
    [powerSync]
  );

  return { updateAvatarColor };
}
