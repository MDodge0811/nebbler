import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
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

/** GET /api/connection-requests — pending incoming/outgoing. */
export function useConnectionRequests() {
  return useQuery({
    queryKey: connectionsKeys.requests(),
    queryFn: listRequests,
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

/** DELETE /api/connections/:id. The synced list updates via PowerSync; refresh profiles. */
export function useRemoveConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (connectionId: string) => removeConnection(connectionId),
    onSuccess: () => invalidateProfiles(queryClient),
  });
}
