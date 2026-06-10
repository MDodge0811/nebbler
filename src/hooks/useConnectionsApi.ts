import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  blockUser,
  getUserProfile,
  listRequests,
  removeConnection,
  resolveRequest,
  sendRequest,
  type ResolveStatus,
} from '@api/connections';

/** Query-key factory for the online connections data. */
export const connectionsKeys = {
  all: ['connections'] as const,
  requests: () => [...connectionsKeys.all, 'requests'] as const,
  profile: (id: string) => [...connectionsKeys.all, 'profile', id] as const,
};

/**
 * GET /api/connection-requests — pending incoming/outgoing. Pending requests are
 * online-only and not pushed yet, so this polls on open: every screen that mounts
 * this query refetches (the contract's "Polled on app open"). Consumers may also
 * call `refetch()` from a focus effect for re-entry without a remount.
 */
export function useConnectionRequests() {
  return useQuery({
    queryKey: connectionsKeys.requests(),
    queryFn: listRequests,
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

/**
 * GET /api/users/:id (online REST, basic info + relationship) — only fetches
 * when an id is provided. Named `...Api` to distinguish it from the PowerSync
 * `useUserProfile` in `useConnections.ts`, which reads a synced row offline.
 */
export function useUserProfileApi(id: string | undefined) {
  return useQuery({
    queryKey: connectionsKeys.profile(id ?? ''),
    queryFn: () => getUserProfile(id as string),
    enabled: !!id,
  });
}

/** Invalidate every cached user-profile query (relationship state may have changed). */
function invalidateProfiles(queryClient: ReturnType<typeof useQueryClient>): void {
  void queryClient.invalidateQueries({ queryKey: [...connectionsKeys.all, 'profile'] });
}

/** POST /api/connection-requests. */
export function useSendRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requesteeId: string) => sendRequest(requesteeId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: connectionsKeys.requests() });
      invalidateProfiles(queryClient);
    },
  });
}

/** PATCH /api/connection-requests/:id. */
export function useResolveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ResolveStatus }) =>
      resolveRequest(id, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: connectionsKeys.requests() });
      invalidateProfiles(queryClient);
    },
  });
}

/** PATCH /api/connections/:id (remove). The synced list updates via PowerSync; refresh profiles. */
export function useRemoveConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (connectionId: string) => removeConnection(connectionId),
    onSuccess: () => invalidateProfiles(queryClient),
  });
}

/**
 * POST /api/blocks (NEB-139). The server severs any connection + cancels pending
 * requests atomically, so the synced connections list self-updates as the row
 * de-syncs; we still refresh the REST request list + profiles for relationship
 * state.
 */
export function useBlockUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (blockeeId: string) => blockUser(blockeeId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: connectionsKeys.requests() });
      invalidateProfiles(queryClient);
    },
  });
}
