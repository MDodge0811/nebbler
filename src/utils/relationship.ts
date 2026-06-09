import type { Relationship } from '@database/schemas';

/**
 * UI-agnostic action derived from a relationship. The component layer (FE-4..6)
 * maps each `kind` to its button(s):
 *   connect → "Connect" | cancel → "Pending" (tap to cancel)
 *   respond → "Accept" / "Decline" | open → "Connected" (open profile)
 */
export type RelationshipAction =
  | { kind: 'connect' }
  | { kind: 'cancel'; requestId: string }
  | { kind: 'respond'; requestId: string }
  | { kind: 'open'; connectionId: string };

/**
 * Map a relationship to its action. Throws on an internally-inconsistent
 * payload (a pending state without `request_id`, or `connected` without
 * `connection_id`) — that is a backend contract violation, not a UI state.
 */
export function relationshipToAction(relationship: Relationship): RelationshipAction {
  const { state, request_id, connection_id } = relationship;
  switch (state) {
    case 'none':
      return { kind: 'connect' };
    case 'outgoing_pending':
      if (!request_id) throw new Error('outgoing_pending relationship is missing request_id');
      return { kind: 'cancel', requestId: request_id };
    case 'incoming_pending':
      if (!request_id) throw new Error('incoming_pending relationship is missing request_id');
      return { kind: 'respond', requestId: request_id };
    case 'connected':
      if (!connection_id) throw new Error('connected relationship is missing connection_id');
      return { kind: 'open', connectionId: connection_id };
  }
}

/**
 * Resolve the other participant of a synced `user_connections` row. Direction is
 * not meaningful once connected, so callers must not assume `user_a` is "me".
 */
export function otherParticipant(
  row: { user_a_id: string; user_b_id: string },
  myId: string
): string {
  return row.user_a_id === myId ? row.user_b_id : row.user_a_id;
}
