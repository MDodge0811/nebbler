---
paths:
  - 'src/database/connector.ts'
  - 'src/services/**'
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

Gets a JWT from the backend for PowerSync authentication.

**Pattern:**

1. Read stored auth token from `secureStorage.getToken()`
2. POST to `/api/powersync/auth` with Bearer token
3. Validate response with `FetchCredentialsResponseSchema.parse(data)`
4. Return `{ endpoint, token, expiresAt }`

**Key details:**

- `endpoint` is the PowerSync URL (from `powersyncConfig.powersyncUrl`), not the backend URL
- `token` is the JWT string from the response
- `expiresAt` is optional — if provided, PowerSync auto-refreshes before expiry
- If auth fails, throw — PowerSync will retry with backoff

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

Tokens are stored via `secureStorage` (`src/utils/secureStorage.ts`):

- `secureStorage.getToken()` — Read stored JWT
- `secureStorage.setToken(token)` — Store JWT after login
- `secureStorage.clearToken()` — Remove on logout

Both `fetchCredentials()` and `uploadCrudEntry()` include the auth token as a Bearer header.

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
2. `connectDatabase()` — Creates `PowerSyncConnector`, calls `powerSyncInstance.connect(connector)`. Called after auth (`AuthContext`). Starts the sync cycle.

**Singleton pattern:** Only one `PowerSyncDatabase` instance exists. `getDatabase()` returns it or throws.

**Disconnect:** `disconnectDatabase()` on logout/shutdown.

## Common Mistakes

- Forgetting to include the auth token header in `uploadCrudEntry()` — causes 401 on all uploads
- Calling `transaction.complete()` inside a catch block — discards failed operations
- Using the backend URL instead of the PowerSync URL for the `endpoint` in `fetchCredentials()`
- Not handling 4xx errors separately — causes infinite retry loops on validation errors
