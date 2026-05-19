---
paths:
  - 'src/hooks/useAuth.ts'
  - 'src/hooks/useCurrentUser.ts'
  - 'src/screens/auth/**'
  - 'src/navigation/AuthNavigator.tsx'
  - 'App.tsx'
---

# Auth System Rules

Docs: [Clerk Expo](https://clerk.com/docs/expo/getting-started/quickstart), [Clerk JWT Templates](https://clerk.com/docs/guides/sessions/jwt-templates), [PowerSync Custom Auth](https://docs.powersync.com/installation/authentication-setup/custom)

## Architecture Overview

```
App.tsx
  └─ ClerkProvider (publishableKey, tokenCache = @clerk/clerk-expo/token-cache)
       └─ PowerSyncContext.Provider
            ├─ ClerkPowerSyncBridge (effect — calls connect/disconnect on isSignedIn)
            └─ AppNavigator (gates on Clerk's isSignedIn / isLoaded)
```

Identity lives in Clerk. The app does not maintain its own auth context, mutation hooks, or token store — Clerk's SDK owns session state and token caching.

**Key files:**

| File                                    | Responsibility                                                                                                         |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `App.tsx`                               | Provider tree root — `ClerkProvider` + `PowerSyncContext.Provider` + `ClerkPowerSyncBridge`                            |
| `src/hooks/useAuth.ts`                  | Adapter over `useClerkAuth` + `useUser` — returns `{ user, isAuthenticated, isLoading, signOut, getToken, clerkUser }` |
| `src/hooks/useCurrentUser.ts`           | Bridges Clerk auth + PowerSync `users` table by our internal UUID                                                      |
| `src/screens/auth/LoginScreen.tsx`      | Email + password sign-in, email-OTP sign-in, OAuth (Google/Apple/Facebook), link to sign-up                            |
| `src/screens/auth/SignUpScreen.tsx`     | Email + password + first/last name → `signUp.create` → email verification                                              |
| `src/screens/auth/VerifyCodeScreen.tsx` | 6-digit code entry; branches on `mode: 'sign-in' \| 'sign-up'`                                                         |
| `src/navigation/AuthNavigator.tsx`      | Auth-stack screens (Login, SignUp, VerifyCode)                                                                         |
| `src/database/connector.ts`             | PowerSync connector + `setClerkTokenGetter`/`clearClerkTokenGetter`                                                    |
| `src/constants/config.ts`               | Exports `clerkPublishableKey` from `expo-constants`                                                                    |
| `src/types/auth.ts`                     | Tiny adapter `User` type used by `useAuth`                                                                             |
| `src/utils/secureStorage.ts`            | Generic `get/set/delete` wrapper — **not** for Clerk tokens (Clerk has its own cache)                                  |

## Two-Layer User Model

There are **two different "user" objects** — this is the most common source of confusion:

| Layer     | Type                                                      | Source                                                                                          | Available when                                                 |
| --------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Auth user | `User { id, email }`                                      | `useAuth()` — `id` is our **internal UUID** read from Clerk's `publicMetadata.internal_user_id` | After the Clerk webhook completes (a beat after first sign-up) |
| DB user   | `DbUser { id, first_name, last_name, display_name, ... }` | PowerSync `users` table                                                                         | After first sync completes                                     |

`useCurrentUser()` bridges both: returns `{ user: DbUser | null, authUser: AuthUser | null }`.

**Rules:**

1. Components must fall back to `authUser.email` (or `clerkUser.primaryEmailAddress`) when `user` is null — sync may not have caught up.
2. `authUser.id` is `null` for a brief window after first sign-up if the backend webhook hasn't yet written `internal_user_id` into Clerk's `publicMetadata`. Anything that requires a UUID (queries, navigation guards) must handle that case.

## useAuth() Adapter

`useAuth()` is a thin wrapper over `@clerk/clerk-expo`'s `useAuth` + `useUser`. It exists so call sites don't need to know about Clerk internals.

```typescript
// GOOD — adapter shape used across the app
const { user, isAuthenticated, isLoading, signOut, getToken, clerkUser } = useAuth();

// Use clerkUser only when you need fields beyond { id, email } (image URL, full
// metadata, etc.). Anything stable should be backed by the DbUser table.
```

For Clerk-specific flows (sign-in, sign-up, OAuth, SSO), import the dedicated hooks directly from `@clerk/clerk-expo`:

```typescript
import { useSignIn, useSignUp, useSSO } from '@clerk/clerk-expo';
```

These hooks expose `create`, `attemptFirstFactor`, `attemptEmailAddressVerification`, `setActive`, etc. The auth screens (`LoginScreen`, `SignUpScreen`, `VerifyCodeScreen`) own those calls; nothing else in the app should.

## Auth Flows

### Sign up (email + password)

```
SignUpScreen
  → signUp.create({ emailAddress, password, firstName, lastName })
  → signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
  → navigate('VerifyCode', { email, mode: 'sign-up' })

VerifyCodeScreen (mode === 'sign-up')
  → signUp.attemptEmailAddressVerification({ code })
  → setActiveSignUp({ session: createdSessionId })
```

### Sign in (password)

```
LoginScreen (email + password filled)
  → signIn.create({ identifier: email, password })
  → if status === 'complete': setActive({ session: createdSessionId })
```

### Sign in (email OTP — passwordless)

```
LoginScreen (only email filled)
  → signIn.create({ strategy: 'email_code', identifier: email })
  → navigate('VerifyCode', { email, mode: 'sign-in' })

VerifyCodeScreen (mode === 'sign-in')
  → signIn.attemptFirstFactor({ strategy: 'email_code', code })
  → setActiveSignIn({ session: createdSessionId })
```

### Sign in (OAuth — Google / Apple / Facebook)

```
LoginScreen
  → useSSO().startSSOFlow({ strategy: 'oauth_google' | 'oauth_apple' | 'oauth_facebook' })
  → setActive({ session: createdSessionId })
```

OAuth requires a dev build (Expo Go can't load the native modules). `WebBrowser.maybeCompleteAuthSession()` is called at module load in `LoginScreen.tsx` so iOS redirects complete cleanly.

### Sign out

```
useAuth().signOut()
  → ClerkPowerSyncBridge effect picks up isSignedIn === false
  → clearClerkTokenGetter()
  → disconnectDatabase()
```

There's no logout mutation. Anywhere you'd previously call `useLogout().mutate()`, call `signOut()` directly.

## Auth ↔ PowerSync Lifecycle

`ClerkPowerSyncBridge` (inside `App.tsx`) is the only component that coordinates connection state:

```
When isSignedIn flips to true:
  1. setClerkTokenGetter(getToken)   — connector now has access to Clerk tokens
  2. connectDatabase()               — PowerSync starts syncing

When isSignedIn flips to false:
  1. clearClerkTokenGetter()
  2. disconnectDatabase()
```

**Critical:** never call `connectDatabase()` / `disconnectDatabase()` from anywhere else. The bridge is the single source of truth so we don't double-connect or leak tokens.

## Two Token Templates

| Template              | Audience    | Custom claims             | Used for                                             |
| --------------------- | ----------- | ------------------------- | ---------------------------------------------------- |
| Default (no template) | n/a         | `sub` = Clerk user id     | Our Phoenix API (`Authorization` on `/api/data/...`) |
| `powersync`           | `powersync` | `user_id` = internal UUID | PowerSync service — direct, no backend hop           |

Connector code reads them via:

```typescript
// API requests
await clerkGetToken();
// PowerSync auth
await clerkGetToken({ template: 'powersync' });
```

The PowerSync template's `user_id` claim is sourced from `user.publicMetadata.internal_user_id`, written by the Phoenix webhook handler on `user.created`. If you change the template name or the claim name in the Clerk dashboard, update **both** `src/database/connector.ts` (`getPowerSyncToken`) and `docker/powersync/sync_rules.yaml` (`request.jwt() ->> 'user_id'`).

## Secure Storage

`secureStorage` in `src/utils/secureStorage.ts` is a generic key/value wrapper. It's **not** the place to put auth tokens — `@clerk/clerk-expo/token-cache` already handles that under the hood with `expo-secure-store`.

Keys to **not** create here:

- `auth_token`, `auth_user`, `clerk_*` — Clerk owns these
- Anything that duplicates what `useAuth().getToken()` already provides

## Environment

| Variable                     | Where it's read                                | Notes                                 |
| ---------------------------- | ---------------------------------------------- | ------------------------------------- |
| `CLERK_PUBLISHABLE_KEY`      | `app.config.ts` → `Constants.expoConfig.extra` | Required at boot. Starts with `pk_…`. |
| `API_PORT`, `POWERSYNC_PORT` | `app.config.ts` (worktree port overrides)      | Optional. Defaults to 4000 / 8080.    |

If `CLERK_PUBLISHABLE_KEY` is empty at runtime, `App.tsx` renders an error screen instead of mounting `ClerkProvider` — the SDK won't initialize without it.

## Navigation Auth Gating

`AppNavigator` reads `useAuth()` to decide which navigator to render:

```typescript
const { isAuthenticated, isLoading } = useAuth();
// isLoading → loading spinner
// isAuthenticated → MainNavigator
// !isAuthenticated → AuthNavigator (Login → SignUp → VerifyCode)
```

No manual navigation on auth state change — the conditional render switches the whole tree when `isSignedIn` flips.

## Testing Auth Code

### Tests mock `@hooks/useAuth`, not `@clerk/clerk-expo`

Existing tests already pass `{ user: { id, email } }` to a mocked `useAuth`. Keep that pattern — the adapter shape didn't change.

```typescript
jest.mock('@hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-uuid-123', email: 'test@example.com' },
    isAuthenticated: true,
    isLoading: false,
    signOut: jest.fn(),
    getToken: jest.fn().mockResolvedValue('fake.jwt.token'),
    clerkUser: null,
  }),
}));
```

### Don't render `<ClerkProvider>` in component tests

Tests should mock `useAuth` (or `useSignIn`/`useSignUp` for auth-screen tests). Spinning up `ClerkProvider` in Jest pulls in native modules and a publishable key — neither is appropriate at the unit level.

### Auth screens

For LoginScreen / SignUpScreen / VerifyCodeScreen, mock the specific Clerk hook used:

```typescript
jest.mock('@clerk/clerk-expo', () => ({
  useSignIn: () => ({
    isLoaded: true,
    signIn: { create: jest.fn().mockResolvedValue({ status: 'complete', createdSessionId: 's' }) },
    setActive: jest.fn(),
  }),
  useSSO: () => ({ startSSOFlow: jest.fn() }),
}));
```

## Common Mistakes

- **Calling `signOut`, `signIn.create`, etc. from outside the auth screens.** Auth flow code is concentrated in three screens by design; sprinkling it elsewhere makes flows hard to follow.
- **Reading `clerkUser.id` and treating it as our user UUID.** That's Clerk's `user_xxx`. For FK queries use `useAuth().user.id` (our UUID) or `useCurrentUser().user.id`.
- **Forgetting that `useAuth().user` can be `null` even when `isAuthenticated === true`.** It will be null until Clerk's `publicMetadata.internal_user_id` is populated — handle that case in screens that need the UUID.
- **Calling `connectDatabase()` outside `ClerkPowerSyncBridge`.** The bridge handles connect/disconnect from the auth-state effect. Manual calls cause double-connects.
- **Storing auth tokens in `secureStorage`.** Clerk has its own token cache; duplicating it leads to drift and stale-token bugs.
