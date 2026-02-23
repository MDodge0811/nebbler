---
paths:
  - 'src/hooks/**'
  - '**/__tests__/**'
  - 'jest.setup.js'
---

# PowerSync Hooks & Queries

All PowerSync React hooks come from `@powersync/react`. Database types come from `@database/schema`.

Docs: [@powersync/react README](https://www.npmjs.com/package/@powersync/react)

## useQuery — Reactive Reads

```typescript
import { useQuery } from '@powersync/react';
import type { MyTable } from '@database/schema';

function useMyData() {
  return useQuery<MyTable>('SELECT * FROM my_table WHERE active = ?', [1]);
}
```

**Returns:** `{ data: T[], isLoading: boolean, error?: Error }`

- Queries run against local SQLite — instant, works offline
- Automatically re-runs when the underlying table changes (reactive)
- Use parameterized queries with `?` placeholders — never interpolate values into SQL
- When the query should return nothing (e.g., no user ID yet), use a falsy WHERE clause: `WHERE 0`

**Pattern for conditional queries:**

```typescript
const { data } = useQuery<User>(
  userId ? 'SELECT * FROM users WHERE id = ?' : 'SELECT * FROM users WHERE 0',
  userId ? [userId] : []
);
```

## usePowerSync — Mutations

```typescript
import { usePowerSync } from '@powersync/react';

function useMyMutations() {
  const powerSync = usePowerSync();

  const create = async (name: string) => {
    const now = new Date().toISOString();
    const result = await powerSync.execute(
      'INSERT INTO my_table (id, name, inserted_at, updated_at) VALUES (uuid(), ?, ?, ?) RETURNING id',
      [name, now, now]
    );
    return result.rows?._array[0]?.id as string;
  };

  const update = async (id: string, name: string) => {
    await powerSync.execute('UPDATE my_table SET name = ?, updated_at = ? WHERE id = ?', [
      name,
      new Date().toISOString(),
      id,
    ]);
  };

  const remove = async (id: string) => {
    await powerSync.execute('DELETE FROM my_table WHERE id = ?', [id]);
  };

  return { create, update, remove };
}
```

**Rules:**

- Always generate UUID with PowerSync's built-in `uuid()` SQLite function in INSERT statements — use `RETURNING id` to capture the generated value
- Always set `inserted_at` and `updated_at` locally (ISO 8601) — gives immediate UI feedback
- Server overwrites timestamps on sync — local values are temporary
- Use `powerSync.execute(sql, params)` for all writes
- Writes go to local SQLite immediately, then queue for upload to backend

## useStatus — Sync State

```typescript
import { useStatus } from '@powersync/react';

function useSyncStatus() {
  const status = useStatus();
  // status.connected — boolean, is WebSocket connected
  // status.hasSynced — boolean, has completed at least one sync
  // status.dataFlowStatus?.downloading — boolean, currently receiving data
  // status.dataFlowStatus?.uploading — boolean, currently sending data
  // status.lastSyncedAt — Date | undefined
}
```

Our wrapper hook (`src/hooks/useSyncStatus.ts`) derives a `SyncState` enum:

- `'connecting'` — not connected, never synced
- `'offline'` — not connected, but has synced before
- `'syncing'` — connected, actively downloading
- `'synced'` — connected, sync complete
- `'connected'` — connected but hasn't synced yet

## Hook Organization

- Location: `src/hooks/`
- Re-export all hooks from `src/hooks/index.ts`
- Query hooks: `useMyData()` — read-only, uses `useQuery`
- Mutation hooks: `useMyMutations()` — CRUD operations, uses `usePowerSync`
- Keep query and mutation hooks in the same file when they share a table (e.g., `useTestItems.ts`)

## Dynamic UPDATE Queries

For partial updates, build SET clauses dynamically:

```typescript
const updateItem = async (id: string, updates: Partial<Omit<MyTable, 'id'>>) => {
  const setClauses: string[] = [];
  const values: (string | number | null)[] = [];

  if (updates.name !== undefined && updates.name !== null) {
    setClauses.push('name = ?');
    values.push(updates.name);
  }
  // ... more fields

  setClauses.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(id); // WHERE clause param

  await powerSync.execute(`UPDATE my_table SET ${setClauses.join(', ')} WHERE id = ?`, values);
};
```

Always append `updated_at` to the SET clause for every update.

## Testing PowerSync Hooks

### Mock Setup

Mock `@powersync/react` at the top of the test file (not in jest.setup.js — tests control the return values):

```typescript
const mockUseQuery = jest.fn();

jest.mock('@powersync/react', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));
```

Use the spread pattern `(...args: unknown[]) => mockFn(...args)` so `jest.fn()` captures the call arguments properly.

### Query Hook Tests

```typescript
it('calls useQuery with correct SQL and params', () => {
  mockUseQuery.mockReturnValue({ data: [], isLoading: false, error: undefined });
  renderHook(() => useMyHook('some-id'));
  expect(mockUseQuery).toHaveBeenCalledWith(expect.stringContaining('SELECT'), ['some-id']);
});
```

### Mutation Hook Tests

```typescript
const mockExecute = jest.fn();
const mockUsePowerSync = jest.fn(() => ({ execute: mockExecute }));

jest.mock('@powersync/react', () => ({
  usePowerSync: () => mockUsePowerSync(),
}));
```

### Global Mocks in jest.setup.js

Native PowerSync modules are mocked globally (tests never need to re-mock these):

```javascript
jest.mock('@op-engineering/op-sqlite', () => ({}));
jest.mock('@powersync/op-sqlite', () => ({
  OPSqliteOpenFactory: jest.fn(),
}));
```

### Test Patterns

- Use `renderHook()` from `@testing-library/react-native`
- Call `jest.clearAllMocks()` in `beforeEach`
- Test the SQL string with `expect.stringContaining()` for resilience against whitespace changes
- When testing components that also use navigation, mock `@react-navigation/native` separately
- Pure logic (Zod schemas, UUID generation) needs no PowerSync mocking

## Common Mistakes

- Interpolating values directly into SQL strings instead of using `?` params (SQL injection risk)
- Forgetting to set `updated_at` in mutation hooks
- Not handling the `data` being empty/null when sync hasn't completed yet
- Mocking `@powersync/react` in `jest.setup.js` instead of per-test (prevents test-specific return values)
