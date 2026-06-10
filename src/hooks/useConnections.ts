import { useQuery } from '@powersync/react';
import { useMemo } from 'react';

export type HydratedConnection = {
  id: string;
  // Other party (resolved from the normalized pair) + their synced profile.
  other_user_id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_color: string | null;
};

/**
 * Reactive list of the current user's active connections, read from the synced
 * normalized `user_connections` pair. Direction is not meaningful: the other
 * party is resolved as `user_a_id === me ? user_b_id : user_a_id`. Pending
 * requests are NOT here — they are online REST (FE-2/FE-4).
 *
 * INNER JOIN on `users`: a connected user's basic info is synced (contract), so
 * in steady state the row is always present. During the brief window where the
 * connection row arrives before the other party's `users` row, that connection
 * is transiently hidden (not dropped) until sync catches up — acceptable here.
 */
export function useConnections(currentUserId: string | undefined) {
  const connected = useQuery<HydratedConnection>(
    currentUserId
      ? `SELECT c.id,
                CASE WHEN c.user_a_id = ? THEN c.user_b_id ELSE c.user_a_id END AS other_user_id,
                u.username, u.first_name, u.last_name, u.avatar_color
         FROM user_connections c
         JOIN users u ON u.id = (CASE WHEN c.user_a_id = ? THEN c.user_b_id ELSE c.user_a_id END)
         WHERE (c.user_a_id = ? OR c.user_b_id = ?)
         ORDER BY u.last_name ASC, u.first_name ASC`
      : `SELECT 1 WHERE 0`,
    currentUserId ? [currentUserId, currentUserId, currentUserId, currentUserId] : []
  );

  return useMemo(
    () => ({ connections: connected.data, isLoading: connected.isLoading }),
    [connected.data, connected.isLoading]
  );
}

/**
 * The active connection row between the current user and `otherUserId`, either
 * direction. Presence of a row means "connected". The `connection_id` is NOT
 * stable across a remove → re-add cycle (contract) — resolve it fresh, never
 * cache it as durable.
 */
export function useConnectionWith(
  currentUserId: string | undefined,
  otherUserId: string | undefined
) {
  const { data } = useQuery<{ id: string }>(
    currentUserId && otherUserId
      ? `SELECT id
         FROM user_connections
         WHERE (user_a_id = ? AND user_b_id = ?)
            OR (user_a_id = ? AND user_b_id = ?)
         LIMIT 1`
      : `SELECT 1 WHERE 0`,
    currentUserId && otherUserId ? [currentUserId, otherUserId, otherUserId, currentUserId] : []
  );

  return data[0] ?? null;
}

/**
 * Count of calendars where BOTH currentUserId AND otherUserId have an
 * active calendar_members row.
 */
export function useSharedCalendarCount(
  currentUserId: string | undefined,
  otherUserId: string | undefined
) {
  const { data } = useQuery<{ count: number }>(
    currentUserId && otherUserId
      ? `SELECT COUNT(*) as count FROM (
           SELECT cm1.calendar_id
           FROM calendar_members cm1
           JOIN calendar_members cm2 ON cm2.calendar_id = cm1.calendar_id
           WHERE cm1.user_id = ?
             AND cm2.user_id = ?
             AND cm1.deleted_at IS NULL
             AND cm2.deleted_at IS NULL
         )`
      : `SELECT 0 as count WHERE 0`,
    currentUserId && otherUserId ? [currentUserId, otherUserId] : []
  );

  return data[0]?.count ?? 0;
}

/**
 * Shared-calendar count per other user, for the whole connection list in one
 * synced query (avoids a per-row hook). Returns a map keyed by the other user's
 * id; absent keys mean zero shared calendars. Counts calendars where both the
 * current user and that user have an active `calendar_members` row.
 */
export function useSharedCalendarCounts(currentUserId: string | undefined) {
  const { data } = useQuery<{ other_user_id: string; count: number }>(
    currentUserId
      ? `SELECT cm_other.user_id AS other_user_id,
                COUNT(DISTINCT cm_other.calendar_id) AS count
         FROM calendar_members cm_self
         JOIN calendar_members cm_other
           ON cm_other.calendar_id = cm_self.calendar_id
          AND cm_other.user_id <> cm_self.user_id
          AND cm_other.deleted_at IS NULL
         WHERE cm_self.user_id = ? AND cm_self.deleted_at IS NULL
         GROUP BY cm_other.user_id`
      : `SELECT 1 WHERE 0`,
    currentUserId ? [currentUserId] : []
  );

  return useMemo(() => {
    const counts: Record<string, number> = {};
    for (const row of data) counts[row.other_user_id] = row.count;
    return counts;
  }, [data]);
}

/**
 * Full list of shared calendars between currentUserId and otherUserId.
 * Requires BOTH users to have an active calendar_members row — never
 * relies on sync-scope assumptions.
 */
export function useSharedCalendars(
  currentUserId: string | undefined,
  otherUserId: string | undefined
) {
  const { data } = useQuery<{ id: string; name: string; type: string; color: string | null }>(
    currentUserId && otherUserId
      ? `SELECT c.id, c.name, c.type, c.color
         FROM calendars c
         JOIN calendar_members cm_self ON cm_self.calendar_id = c.id
           AND cm_self.user_id = ? AND cm_self.deleted_at IS NULL
         JOIN calendar_members cm_other ON cm_other.calendar_id = c.id
           AND cm_other.user_id = ? AND cm_other.deleted_at IS NULL
         WHERE c.deleted_at IS NULL
         ORDER BY c.name ASC`
      : `SELECT 1 WHERE 0`,
    currentUserId && otherUserId ? [currentUserId, otherUserId] : []
  );

  return data;
}

/**
 * Minimal user profile (id + name + avatar_color) for any user the client
 * has synced (own row or connected user).
 */
export function useUserProfile(userId: string | undefined) {
  const { data } = useQuery<{
    id: string;
    username: string | null;
    first_name: string | null;
    last_name: string | null;
    avatar_color: string | null;
  }>(
    userId
      ? `SELECT id, username, first_name, last_name, avatar_color FROM users WHERE id = ? AND deleted_at IS NULL`
      : `SELECT 1 WHERE 0`,
    userId ? [userId] : []
  );

  return data[0] ?? null;
}
