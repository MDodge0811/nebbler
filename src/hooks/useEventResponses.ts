import { useQuery, usePowerSync } from '@powersync/react';
import type { EventResponse } from '@database/schema';

/**
 * Reactive query for event responses (RSVPs) for a specific event.
 * Sync rules limit results to the current user's own responses only.
 * For the full RSVP list, use the REST API: GET /api/events/:event_id/responses.
 *
 * Uses conditional query pattern when eventId is undefined.
 */
export function useEventResponses(eventId: string | undefined) {
  return useQuery<EventResponse>(
    eventId
      ? 'SELECT * FROM event_responses WHERE event_id = ? AND deleted_at IS NULL'
      : 'SELECT * FROM event_responses WHERE 0',
    eventId ? [eventId] : []
  );
}

/**
 * CRUD mutations for event responses (RSVPs).
 */
export function useEventResponseMutations() {
  const powerSync = usePowerSync();

  const createResponse = async (eventId: string, userId: string, status?: string) => {
    const now = new Date().toISOString();
    const resolvedStatus = status ?? 'pending';
    const respondedAt = resolvedStatus !== 'pending' ? now : null;

    const result = await powerSync.execute(
      `INSERT INTO event_responses
         (id, event_id, user_id, status, responded_at, inserted_at, updated_at)
       VALUES (uuid(), ?, ?, ?, ?, ?, ?) RETURNING id`,
      [eventId, userId, resolvedStatus, respondedAt, now, now]
    );

    return result.rows?._array[0]?.id as string;
  };

  const updateResponse = async (id: string, status: string) => {
    const now = new Date().toISOString();
    const respondedAt = status !== 'pending' ? now : null;

    await powerSync.execute(
      `UPDATE event_responses
       SET status = ?, responded_at = ?, updated_at = ?
       WHERE id = ?`,
      [status, respondedAt, now, id]
    );
  };

  return { createResponse, updateResponse };
}
