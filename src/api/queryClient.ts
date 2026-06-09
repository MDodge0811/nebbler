import { QueryClient } from '@tanstack/react-query';

/**
 * App-wide singleton QueryClient for online REST work.
 *
 * Convention (lint-enforced — see .claude/rules/api-data.md):
 *   - PowerSync `useQuery` for synced / offline-readable data.
 *   - TanStack Query for all online REST. The actual `fetch` lives in
 *     `src/api/**` query/mutation functions; everything else consumes a hook.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});
