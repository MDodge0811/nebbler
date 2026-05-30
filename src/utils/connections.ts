import { getDatabase } from '@database/database';

function nowISO(): string {
  return new Date().toISOString();
}

/**
 * Insert a pending connection request from requester → addressee.
 * Returns the generated connection id.
 */
export async function sendConnectionRequest(
  addresseeId: string,
  requesterId: string
): Promise<string> {
  const ps = getDatabase();
  const now = nowISO();
  const result = await ps.execute(
    `INSERT INTO user_connections
       (id, requester_id, addressee_id, status, blocker_id, deleted_at, inserted_at, updated_at)
     VALUES (uuid(), ?, ?, ?, NULL, NULL, ?, ?)
     RETURNING id`,
    [requesterId, addresseeId, 'pending', now, now]
  );
  return result.rows?._array[0]?.id as string;
}

/**
 * Accept a pending connection request — sets status = 'accepted'.
 */
export async function acceptConnection(connectionId: string): Promise<void> {
  const ps = getDatabase();
  const now = nowISO();
  await ps.execute(
    `UPDATE user_connections
     SET status = ?, updated_at = ?
     WHERE id = ?`,
    ['accepted', now, connectionId]
  );
}

/**
 * Decline a pending connection request — sets status = 'declined'.
 */
export async function declineConnection(connectionId: string): Promise<void> {
  const ps = getDatabase();
  const now = nowISO();
  await ps.execute(
    `UPDATE user_connections
     SET status = ?, updated_at = ?
     WHERE id = ?`,
    ['declined', now, connectionId]
  );
}

/**
 * Cancel a sent (pending) request — soft-deletes the row via deleted_at.
 */
export async function cancelSentRequest(connectionId: string): Promise<void> {
  const ps = getDatabase();
  const now = nowISO();
  await ps.execute(
    `UPDATE user_connections
     SET deleted_at = ?, updated_at = ?
     WHERE id = ?`,
    [now, now, connectionId]
  );
}

/**
 * Remove an accepted connection — soft-deletes the row via deleted_at.
 * The server will cascade any related cleanup on sync.
 */
export async function removeConnection(connectionId: string): Promise<void> {
  const ps = getDatabase();
  const now = nowISO();
  await ps.execute(
    `UPDATE user_connections
     SET deleted_at = ?, updated_at = ?
     WHERE id = ?`,
    [now, now, connectionId]
  );
}

/**
 * Block a user.
 *
 * If an active connection row already exists between the two users it is
 * updated in-place (status = 'blocked', blocker_id = currentUserId,
 * deleted_at cleared). If no such row exists, a new one is inserted.
 */
export async function blockUser(otherUserId: string, currentUserId: string): Promise<void> {
  const ps = getDatabase();
  const now = nowISO();

  const existing = await ps.getOptional<{ id: string }>(
    `SELECT id FROM user_connections
     WHERE ((requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?))
       AND deleted_at IS NULL
     LIMIT 1`,
    [currentUserId, otherUserId, otherUserId, currentUserId]
  );

  if (existing) {
    await ps.execute(
      `UPDATE user_connections
       SET status = ?, blocker_id = ?, deleted_at = NULL, updated_at = ?
       WHERE id = ?`,
      ['blocked', currentUserId, now, existing.id]
    );
  } else {
    await ps.execute(
      `INSERT INTO user_connections
         (id, requester_id, addressee_id, status, blocker_id, deleted_at, inserted_at, updated_at)
       VALUES (uuid(), ?, ?, ?, ?, NULL, ?, ?)`,
      [currentUserId, otherUserId, 'blocked', currentUserId, now, now]
    );
  }
}
