import type { UseMutationResult } from '@tanstack/react-query';
import { useCallback } from 'react';

import { connectionErrorMessage } from '@api/connections';

import { useSyncStatus } from './useSyncStatus';

/** Outcome of an online-gated action — the caller maps this to a toast / next step. */
export type OnlineActionResult =
  | { status: 'success' }
  | { status: 'offline'; message: string }
  | { status: 'error'; message: string; error: unknown };

const OFFLINE_MESSAGE = "You're offline — reconnect to do that.";

/**
 * FE-3 — the online-required mutation UX primitive. Wraps an online-only mutation
 * (an FE-2 `useConnectionsApi` hook) and enforces the contract's behavioral
 * inversion: connection mutations are online-only, never offline-optimistic.
 *
 * - **Connectivity gate:** while offline, `run` short-circuits to
 *   `{ status: 'offline' }` — no queue, no optimistic state, never a silent no-op.
 * - **In-flight:** `isPending` drives disable + spinner at the call site.
 * - **Errors:** surfaced as a typed result with friendly copy (the hook layer can't
 *   import the toast component, so the screen owns the toast but reuses this text).
 * - **Success:** relies on the wrapped mutation's cache invalidation → refetch.
 *   This hook never writes local/optimistic state, so the UI only changes once the
 *   server-confirmed refetch lands.
 */
export function useOnlineAction<TVars>(mutation: UseMutationResult<unknown, unknown, TVars>) {
  const { isConnected } = useSyncStatus();
  const { mutateAsync, isPending } = mutation;

  const run = useCallback(
    async (vars: TVars): Promise<OnlineActionResult> => {
      if (!isConnected) return { status: 'offline', message: OFFLINE_MESSAGE };
      try {
        await mutateAsync(vars);
        return { status: 'success' };
      } catch (error) {
        return { status: 'error', message: connectionErrorMessage(error), error };
      }
    },
    [isConnected, mutateAsync]
  );

  return { run, isPending, isConnected, offlineMessage: OFFLINE_MESSAGE };
}
