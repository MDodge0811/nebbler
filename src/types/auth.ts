/**
 * Shared auth-related types. The actual identity provider is Clerk
 * (`@clerk/clerk-expo`) — these types are the adapter shape used by
 * `useAuth()` so callers don't depend on Clerk's surface directly.
 */

/**
 * The authenticated user from the app's point of view. `id` is our
 * internal UUID (synced from Clerk's `public_metadata.internal_user_id`
 * by the backend webhook), not Clerk's `user_xxx`.
 */
export interface User {
  id: string;
  email: string;
}

/**
 * OAuth providers offered on the sign-in screen. Kept here (a leaf `type`
 * module) so both the auth adapter (`useOAuthSignIn`) and the presentational
 * `SocialSignInButtons` can share it without coupling to the identity
 * provider's own strategy union.
 */
export type OAuthStrategy = 'oauth_google' | 'oauth_apple' | 'oauth_facebook';
