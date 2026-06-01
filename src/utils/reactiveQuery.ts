/**
 * Collapses the "conditional PowerSync query" pattern into a single call.
 *
 * When `enabled` is false, returns an SQL string that matches zero rows so the
 * reactive `useQuery` stays subscribed to nothing until its inputs are ready.
 *
 *   const [sql, params] = reactiveQuery(!!userId, 'SELECT * FROM users WHERE id = ?', [userId]);
 *   const { data } = useQuery<User>(sql, params);
 */
export function reactiveQuery(
  enabled: boolean,
  sql: string,
  params: unknown[]
): [string, unknown[]] {
  return enabled ? [sql, params] : ['SELECT 1 WHERE 0', []];
}

/** First row of a query result, or null when empty. */
export function firstRow<T>(rows: T[]): T | null {
  return rows[0] ?? null;
}
