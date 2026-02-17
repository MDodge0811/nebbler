---
paths:
  - 'src/context/AuthContext.tsx'
  - 'src/hooks/useAuth.ts'
  - 'src/hooks/useAuthMutations.ts'
  - 'src/hooks/useCurrentUser.ts'
  - 'src/services/**'
  - 'src/types/auth.ts'
  - 'src/utils/secureStorage.ts'
  - 'src/database/schemas/authSchemas.ts'
  - 'src/screens/auth/**'
---

# Auth System Rules

Docs: [TanStack Query Mutations](https://tanstack.com/query/latest/docs/framework/react/guides/mutations), [expo-secure-store](https://docs.expo.dev/versions/latest/sdk/securestore/)

## Architecture Overview

```
App.tsx
  └─ QueryClientProvider (TanStack Query — mutations only)
       └─ AuthProvider (context: user, token, isAuthenticated, isLoading)
            └─ PowerSyncContext.Provider
                 └─ AppNavigator (gates auth vs. main nav based on isAuthenticated)
```

**Key files:**

| File                                  | Responsibility                                                    |
| ------------------------------------- | ----------------------------------------------------------------- |
| `App.tsx`                             | Provider tree root — `QueryClientProvider` wraps everything       |
| `src/context/AuthContext.tsx`         | `AuthProvider`, `AuthContext`, `setAuth`/`clearAuth`              |
| `src/hooks/useAuth.ts`                | `useAuth()` — typed context access with throw-guard               |
| `src/hooks/useAuthMutations.ts`       | `useLogin()`, `useRegister()`, `useLogout()` — TanStack mutations |
| `src/hooks/useCurrentUser.ts`         | Bridges auth context + PowerSync `users` table                    |
| `src/services/authService.ts`         | `ApiAuthService` implementing `IAuthService`                      |
| `src/utils/secureStorage.ts`          | `expo-secure-store` wrapper — only access point                   |
| `src/types/auth.ts`                   | `User`, `AuthState`, `IAuthService`, credential types             |
| `src/database/schemas/authSchemas.ts` | Zod schemas for login/register forms + API response               |

## Two-Layer User Model

There are **two different "user" objects** — this is the most common source of confusion:

| Layer     | Type                                                      | Source                  | Available when             |
| --------- | --------------------------------------------------------- | ----------------------- | -------------------------- |
| Auth user | `User { id, email }`                                      | `useAuth()`             | Immediately on login       |
| DB user   | `DbUser { id, first_name, last_name, display_name, ... }` | PowerSync `users` table | After first sync completes |

`useCurrentUser()` bridges both: returns `{ user: DbUser | null, authUser: AuthUser | null }`.

**Rule:** Components must fall back to `authUser.email` when `user` is null (sync not yet complete). Never assume the DB user is available immediately after login.

## useAuth() Throw-Guard

`useAuth()` throws if called outside `AuthProvider`. Always use the hook — never call `useContext(AuthContext)` directly:

```typescript
// GOOD
const { user, isAuthenticated } = useAuth();

// BAD — no type safety, no throw-guard
const context = useContext(AuthContext);
```

## TanStack Query: Mutations Only

TanStack Query is used **exclusively for auth mutations** (login, register, logout). All data reads go through PowerSync's `useQuery`.

**Never use** `useQuery` from `@tanstack/react-query` — that would bypass PowerSync's offline-first data layer.

```typescript
// GOOD — auth action via TanStack mutation
import { useMutation } from '@tanstack/react-query';

// GOOD — data read via PowerSync
import { useQuery } from '@powersync/react';

// BAD — data read via TanStack (bypasses offline-first)
import { useQuery } from '@tanstack/react-query';
```

`QueryClientProvider` lives in `App.tsx` with `retry: false` for mutations — auth failures should not auto-retry.

## Auth ↔ PowerSync Lifecycle

Login and logout coordinate PowerSync connection state:

```
Login/Register success:
  1. secureStorage.setToken(token) + secureStorage.setUser(user)
  2. setAuth(user, token)          — updates AuthContext
  3. connectDatabase()             — starts PowerSync sync

Logout (success OR error):
  1. disconnectDatabase()          — stops PowerSync sync
  2. secureStorage.clear()         — removes token + user from device
  3. clearAuth()                   — resets AuthContext

App startup (AuthProvider mount):
  1. Read token + user from secureStorage
  2. If both exist → setState(authenticated) + connectDatabase()
  3. If missing → setState(not authenticated, not loading)
```

**Critical:** Logout clears locally even if the server call fails — the `onError` handler in `useLogout` mirrors the `onSuccess` handler exactly.

## Secure Storage

`secureStorage` in `src/utils/secureStorage.ts` is the **only** module that imports `expo-secure-store`. Never import `SecureStore` directly elsewhere.

Two keys persisted:

- `auth_token` — JWT string
- `auth_user` — JSON-serialized `{ id, email }`

All get methods return `null` on error (never throw). Set/delete methods propagate errors.

## Auth Service (IAuthService)

`src/services/authService.ts` exports a singleton `authService: IAuthService`.

**Endpoints:**

- `POST /api/auth/login` — sends `{ email, password, device }`, returns `{ user, access_token, device_id }`
- `POST /api/auth/register` — sends `{ email, password, first_name, last_name, device }`, same response
- `POST /api/auth/logout` — sends `Authorization: Bearer <token>`

**Patterns:**

- All responses validated with `AuthResponseSchema.parse()` (Zod)
- API maps `access_token` → `token` before validation
- Device fingerprint sent on every login/register: `{ fingerprint: "ios-18.0", type: "ios", ... }`
- `refreshToken()` and `getCurrentUser()` are stubs — throw "not yet implemented"
- `apiRequest<T>()` is the private fetch helper — normalizes errors from `data.errors.detail` or `data.error`

**Extending auth:** Implement the `IAuthService` interface and swap the export in `authService.ts`.

## Zod Schemas

Auth schemas in `src/database/schemas/authSchemas.ts`:

| Schema               | Purpose                                                                                        |
| -------------------- | ---------------------------------------------------------------------------------------------- |
| `LoginSchema`        | Form validation: email (required, valid format) + password (required, 8+ chars)                |
| `RegisterSchema`     | Form validation: name fields + password strength (uppercase, lowercase, digit) + confirm match |
| `AuthResponseSchema` | API response validation: `{ user: { id, email }, token, expiresAt? }`                          |

## Navigation Auth Gating

`AppNavigator` reads `useAuth()` to decide which navigator to render:

```typescript
const { isAuthenticated, isLoading } = useAuth();
// isLoading → loading spinner
// isAuthenticated → MainNavigator (tabs + drawer + stack)
// !isAuthenticated → AuthNavigator (login + register screens)
```

No manual navigation on login/logout — the conditional render switches the entire navigator tree automatically.

## Testing Auth Code

### Testing authService

Mock `globalThis.fetch` directly (authService uses raw fetch, not a library):

```typescript
function mockFetchResponse(status: number, body: unknown) {
  (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  });
}

beforeEach(() => {
  globalThis.fetch = jest.fn();
});
afterEach(() => {
  jest.restoreAllMocks();
});
```

### Testing components that use useAuth

Mock the hook to control auth state:

```typescript
jest.mock('@hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-1', email: 'test@example.com' },
    token: 'mock-token',
    isAuthenticated: true,
    isLoading: false,
    setAuth: jest.fn(),
    clearAuth: jest.fn(),
  }),
}));
```

### Testing useAuthMutations

Requires mocking both TanStack Query's `useMutation` and the auth dependencies (`authService`, `secureStorage`, `connectDatabase`, `disconnectDatabase`).
