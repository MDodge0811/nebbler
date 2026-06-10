import { useQuery } from '@tanstack/react-query';

import { searchUsers } from '@api/userSearch';

/**
 * Online user search (FE-5). Wraps the `src/api/userSearch` query fn in TanStack
 * Query — the lint-enforced standard for online REST. Callers should debounce the
 * query (≥300ms) before passing it in; the hook only fires for ≥2 chars and does
 * not retry (so a 429 surfaces once rather than hammering the limiter).
 */
export function useUserSearch(query: string) {
  const trimmed = query.trim();
  return useQuery({
    queryKey: ['users', 'search', trimmed],
    queryFn: () => searchUsers(trimmed),
    enabled: trimmed.length >= 2,
    retry: false,
    staleTime: 30_000,
  });
}
