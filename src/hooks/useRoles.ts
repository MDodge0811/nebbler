import { useQuery } from '@powersync/react';
import type { Role } from '@database/schema';

/**
 * Reactive query for all roles, ordered by level descending.
 */
export function useRoles() {
  return useQuery<Role>('SELECT * FROM roles ORDER BY level DESC');
}

/**
 * Returns the owner role (level 40) from the synced roles table.
 * Used to gate calendar creation — the owner membership row requires a role ID.
 */
export function useOwnerRole() {
  const { data: roles, isLoading, error } = useRoles();
  const ownerRole = roles.find((r) => r.level === 40) ?? null;
  return { ownerRole, isLoading, error };
}
