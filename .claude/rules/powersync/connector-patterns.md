---
paths:
  - 'src/database/connector.ts'
  - 'src/database/schemas/apiSchemas.ts'
  - 'src/database/schemas/configSchema.ts'
  - 'src/utils/secureStorage.ts'
  - 'src/constants/config.ts'
---

# PowerSync Connector Patterns

The connector (`src/database/connector.ts`) implements `PowerSyncBackendConnector` from `@powersync/react-native`. It handles two things: authentication and uploading local changes.

Docs: [Backend Connector Reference](https://docs.powersync.com/client-sdks/reference/react-native-and-expo)

## Interface

```typescript
import {
  AbstractPowerSyncDatabase,
  CrudEntry,
  PowerSyncBackendConnector,
  UpdateType,
} from '@powersync/react-native';
```

Two required methods:

- `fetchCredentials()` — Called by PowerSync on connect and token refresh
- `uploadData(database)` — Called automatically when local changes are queued

## fetchCredentials()

Gets a Clerk-signed JWT for the `powersync` template and hands it directly to PowerSync — **no backend hop**.

**Pattern:**

1. Call `clerkGetToken({ template: 'powersync' })` (the getter is set at module level by `ClerkPowerSyncBridge` in `App.tsx`).
2. Validate the token shape with `FetchCredentialsResponseSchema.parse({ token })`.
3. Return `{ endpoint: powersyncConfig.powersyncUrl, token }`.

**Key details:**

- `endpoint` is the PowerSync URL (from `powersyncConfig.powersyncUrl`), not the backend URL.
- `token` is a Clerk-issued JWT whose `aud = 'powersync'` and `user_id` claim equals our internal UUID (sourced from `clerkUser.publicMetadata.internal_user_id`).
- If `clerkGetToken` returns `null`, the user isn't signed in — throw. PowerSync retries with backoff and the `ClerkPowerSyncBridge` will only call `connect` once a session exists.
- We don't pass `expiresAt`; Clerk's SDK caches tokens and refreshes them automatically. PowerSync calls `fetchCredentials` again when it needs a new one.

**Zod validation** (`src/database/schemas/apiSchemas.ts`):

```typescript
export const FetchCredentialsResponseSchema = z.object({
  token: z.string().min(1, 'Token must not be empty'),
  expiresAt: z.string().optional(),
});
```

## uploadData()

Processes the local CRUD queue — called automatically by PowerSync when changes exist.

**Pattern:**

1. Get next transaction: `database.getNextCrudTransaction()`
2. If null, return (no pending changes)
3. Loop through `transaction.crud` entries
4. Call `uploadCrudEntry()` for each
5. Mark complete: `transaction.complete()`
6. On error, throw — PowerSync retries the entire transaction

**Never call `transaction.complete()` if any entry failed** — this would discard the failed operation.

## uploadCrudEntry()

Maps PowerSync operations to HTTP methods against the backend.

**Operation type mapping:**
| PowerSync Op | HTTP Method | When |
|-------------|-------------|------|
| `UpdateType.PUT` | PUT | Record created locally |
| `UpdateType.PATCH` | PATCH | Record updated locally |
| `UpdateType.DELETE` | DELETE | Record deleted locally |

**Endpoint:** `{backendUrl}/api/data/{table}/{id}`

**Error classification (critical pattern):**

- **4xx (400-499):** Permanent failure — log and skip. The server rejected the operation (validation error, not found, conflict). Retrying won't help and would cause an infinite loop.
- **5xx (500+):** Transient failure — throw so PowerSync retries the transaction with backoff.

```typescript
if (!response.ok) {
  if (response.status >= 400 && response.status < 500) {
    console.error(`[PowerSync] Permanent failure: ${response.status} — skipping`);
    return; // Skip this entry, continue with the rest
  }
  throw new Error(`Upload failed: ${response.status}`); // Retry via PowerSync
}
```

## Auth Token Management

The connector pulls tokens from Clerk through a module-level getter — it has no direct dependency on the SDK and no notion of token storage. `App.tsx`'s `ClerkPowerSyncBridge` installs the getter when a session exists and clears it on sign-out:

```typescript
// Inside ClerkPowerSyncBridge in App.tsx
if (isSignedIn) {
  setClerkTokenGetter(getToken);
  connectDatabase();
} else {
  clearClerkTokenGetter();
  disconnectDatabase();
}
```

Two consumers use the getter:

| Caller               | Template invocation                        | Audience          |
| -------------------- | ------------------------------------------ | ----------------- |
| `fetchCredentials()` | `clerkGetToken({ template: 'powersync' })` | PowerSync service |
| `uploadCrudEntry()`  | `clerkGetToken()` (default session token)  | Phoenix API       |

Clerk's SDK handles caching and refresh internally — do not memoize tokens in the connector.

## Config Validation

PowerSync URLs are validated at app startup (`src/constants/config.ts`) using Zod:

```typescript
const urlString = z.string().refine(
  (val) => {
    try {
      new URL(val);
      return true;
    } catch {
      return false;
    }
  },
  { message: 'Must be a valid URL' }
);
```

Uses `new URL()` instead of `z.string().url()` to support `http://localhost:*` development URLs.

## Database Lifecycle

Location: `src/database/database.ts`

**Two-phase initialization:**

1. `initializeDatabase()` — Creates local SQLite DB with `OPSqliteOpenFactory`, initializes schema. Called on app start (`App.tsx`). Does NOT connect to backend.
2. `connectDatabase()` — Creates `PowerSyncConnector`, calls `powerSyncInstance.connect(connector)`. Called by `ClerkPowerSyncBridge` whenever Clerk's `isSignedIn` flips to `true`. Starts the sync cycle.

**Singleton pattern:** Only one `PowerSyncDatabase` instance exists. `getDatabase()` returns it or throws.

**Disconnect:** `disconnectDatabase()` called by `ClerkPowerSyncBridge` on sign-out.

## Common Mistakes

- Forgetting to install the Clerk token getter — `fetchCredentials` returns null and PowerSync can never authenticate. Only `ClerkPowerSyncBridge` should call `setClerkTokenGetter`.
- Calling `connectDatabase()` / `disconnectDatabase()` outside the bridge — causes double-connects or premature disconnects.
- Calling `transaction.complete()` inside a catch block — discards failed operations.
- Using the backend URL instead of the PowerSync URL for the `endpoint` in `fetchCredentials()`.
- Not handling 4xx errors separately in `uploadCrudEntry()` — causes infinite retry loops on validation errors.
- Caching the result of `clerkGetToken()` in the connector — the SDK already does it correctly. A stale token survives token rotation and breaks sync.
