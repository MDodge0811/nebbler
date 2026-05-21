import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-expo';

/**
 * Adapter over `@clerk/clerk-expo`'s `useAuth` + `useUser` that returns the
 * shape callers in this app expect: `{ user, isAuthenticated, isLoading, signOut, getToken }`.
 *
 * `user.id` is our **internal UUID** (read from
 * `clerkUser.publicMetadata.internal_user_id`, which the Phoenix webhook
 * handler writes during `user.created`). May be `null` for a brief moment
 * after first sign-up if the webhook hasn't completed yet — consumers
 * should handle that.
 */
export function useAuth() {
  const clerk = useClerkAuth();
  const { user: clerkUser, isLoaded: userLoaded } = useUser();

  const internalUserId =
    (clerkUser?.publicMetadata?.internal_user_id as string | undefined) ?? null;

  const user =
    clerkUser && internalUserId
      ? {
          id: internalUserId,
          email: clerkUser.primaryEmailAddress?.emailAddress ?? '',
        }
      : null;

  return {
    user,
    isAuthenticated: !!clerk.isSignedIn,
    isLoading: !clerk.isLoaded || !userLoaded,
    signOut: clerk.signOut,
    getToken: clerk.getToken,
    /** Raw Clerk user — use when you need fields beyond `id`/`email`. */
    clerkUser,
  };
}
