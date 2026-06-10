import { useQuery } from '@powersync/react';
import { useMemo } from 'react';

import type { EventStar } from '@database/schema';
import { useCurrentUser } from '@hooks/useCurrentUser';
import { reactiveQuery } from '@utils/reactiveQuery';

/**
 * Returns a Set of event_ids that the current user has starred.
 *
 * The PowerSync `user_stars` sync bucket already scopes rows to the current
 * user, but we also filter by user_id here for belt-and-suspenders safety
 * (e.g., local writes from a different user session that haven't synced yet).
 */
export function useEventStars(): Set<string> {
  const { user } = useCurrentUser();
  const userId = user?.id;

  const [sql, params] = reactiveQuery(
    !!userId,
    'SELECT event_id, user_id FROM event_stars WHERE deleted_at IS NULL AND user_id = ?',
    [userId]
  );
  const { data } = useQuery<Pick<EventStar, 'event_id' | 'user_id'>>(sql, params);

  return useMemo(
    () => new Set(data.map((row) => row.event_id).filter((id): id is string => id !== null)),
    [data]
  );
}
