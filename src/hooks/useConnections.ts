import { useQuery } from '@powersync/react';
import { useMemo } from 'react';

export type HydratedConnection = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'blocked';
  blocker_id: string | null;
  // Other party's profile (joined locally)
  other_user_id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_color: string | null;
};

/**
 * Reactive query returning the current user's connections, partitioned
 * by status. Each row is hydrated with the other party's name + avatar
 * via a local SQLite JOIN onto the synced `users` table.
 *
 * Sync rules already exclude soft-deleted and blocker-side-blocked rows,
 * but we filter `deleted_at IS NULL` defensively.
 */
export function useConnections(currentUserId: string | undefined) {
  const incoming = useQuery<HydratedConnection>(
    currentUserId
      ? `SELECT c.id, c.requester_id, c.addressee_id, c.status, c.blocker_id,
                c.requester_id AS other_user_id,
                u.first_name, u.last_name, u.avatar_color
         FROM user_connections c
         JOIN users u ON u.id = c.requester_id
         WHERE c.addressee_id = ? AND c.status = 'pending' AND c.deleted_at IS NULL
         ORDER BY c.inserted_at DESC`
      : `SELECT 1 WHERE 0`,
    currentUserId ? [currentUserId] : []
  );

  const accepted = useQuery<HydratedConnection>(
    currentUserId
      ? `SELECT c.id, c.requester_id, c.addressee_id, c.status, c.blocker_id,
                CASE WHEN c.requester_id = ? THEN c.addressee_id ELSE c.requester_id END AS other_user_id,
                u.first_name, u.last_name, u.avatar_color
         FROM user_connections c
         JOIN users u ON u.id = (CASE WHEN c.requester_id = ? THEN c.addressee_id ELSE c.requester_id END)
         WHERE (c.requester_id = ? OR c.addressee_id = ?)
           AND c.status = 'accepted'
           AND c.deleted_at IS NULL
         ORDER BY u.last_name ASC, u.first_name ASC`
      : `SELECT 1 WHERE 0`,
    currentUserId ? [currentUserId, currentUserId, currentUserId, currentUserId] : []
  );

  const outgoing = useQuery<HydratedConnection>(
    currentUserId
      ? `SELECT c.id, c.requester_id, c.addressee_id, c.status, c.blocker_id,
                c.addressee_id AS other_user_id,
                u.first_name, u.last_name, u.avatar_color
         FROM user_connections c
         JOIN users u ON u.id = c.addressee_id
         WHERE c.requester_id = ? AND c.status = 'pending' AND c.deleted_at IS NULL
         ORDER BY c.inserted_at DESC`
      : `SELECT 1 WHERE 0`,
    currentUserId ? [currentUserId] : []
  );

  return useMemo(
    () => ({
      pendingIncoming: incoming.data ?? [],
      accepted: accepted.data ?? [],
      pendingOutgoing: outgoing.data ?? [],
      isLoading: incoming.isLoading || accepted.isLoading || outgoing.isLoading,
    }),
    [
      incoming.data,
      accepted.data,
      outgoing.data,
      incoming.isLoading,
      accepted.isLoading,
      outgoing.isLoading,
    ]
  );
}

/**
 * Active connection row between current user and `otherUserId`, either direction.
 * Filters explicitly by both parties so behavior does not depend on sync-rule scope.
 */
export function useConnectionWith(
  currentUserId: string | undefined,
  otherUserId: string | undefined
) {
  const { data } = useQuery<{
    id: string;
    status: 'pending' | 'accepted' | 'declined' | 'blocked';
    requester_id: string;
    addressee_id: string;
  }>(
    currentUserId && otherUserId
      ? `SELECT id, status, requester_id, addressee_id
         FROM user_connections
         WHERE ((requester_id = ? AND addressee_id = ?)
             OR (requester_id = ? AND addressee_id = ?))
           AND deleted_at IS NULL
         LIMIT 1`
      : `SELECT 1 WHERE 0`,
    currentUserId && otherUserId ? [currentUserId, otherUserId, otherUserId, currentUserId] : []
  );

  return data && data.length > 0 ? data[0] : null;
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

  return data && data.length > 0 ? data[0].count : 0;
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

  return data ?? [];
}

/**
 * Minimal user profile (id + name + avatar_color) for any user the client
 * has synced (own row or connected user).
 */
export function useUserProfile(userId: string | undefined) {
  const { data } = useQuery<{
    id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_color: string | null;
  }>(
    userId
      ? `SELECT id, first_name, last_name, avatar_color FROM users WHERE id = ? AND deleted_at IS NULL`
      : `SELECT 1 WHERE 0`,
    userId ? [userId] : []
  );

  return data && data.length > 0 ? data[0] : null;
}
