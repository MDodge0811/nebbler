# People-Tab FE-1: Connections Data-Model Rewrite — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:subagent-driven-development (recommended) or superpowers-extended-cc:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the local `user_connections` model to the contract's normalized synced pair, sever the client-side write path, reduce the connection hooks to reads-only, and stand up a lint-enforced TanStack Query foundation for online API work.

**Architecture:** `user_connections` becomes `{user_a_id, user_b_id, timestamps}` (read-only sync; removal = row eviction, no `deleted_at`). All mutations leave the client (move to REST in FE-2). A `READ_ONLY_TABLES` guard in the PowerSync connector blocks stray uploads. TanStack Query is added with two ESLint guardrails (no raw `fetch` outside the API home; `@tanstack/react-query` contained to `src/hooks/**` + `src/api/**`). The four People-tab screens are minimally neutralized so `npm run check` stays green; their real rewires are FE-4/5/6/7.

**Tech Stack:** TypeScript, React Native, PowerSync (`@powersync/react`, `@powersync/react-native`), Zod, `@tanstack/react-query`, Jest, ESLint flat config.

**Source of truth:** [Connections API Contract](https://linear.app/nebbler/document/connections-api-contract-be-fe-efaede5e5b39). Spec: `docs/superpowers/specs/2026-06-08-people-tab-fe1-data-model-design.md`.

**Verification note:** Tasks 1–4 change tightly-coupled data-layer files; project-wide `tsc`/lint will not be green until the screens are neutralized in Task 5. Each of Tasks 1–4 is therefore verified by running its **own Jest suite** (jest uses babel — it does not typecheck unrelated files). **Task 5 is the green gate: full `npm run check`.** Commit at every task on the feature branch regardless.

**Branch:** `dodgemalachi/neb-149-fe-1-connections-data-model-rewrite-sync-alignment-remove` (already checked out in the `nebbler/` submodule). All paths below are relative to the `nebbler/` submodule root.

---

### Task 0: TanStack Query foundation + lint hard-check

**Goal:** Add `@tanstack/react-query`, wrap the app in a `QueryClientProvider`, and add the two ESLint guardrails that force all online API work through TanStack Query — independently of the connections rewrite.

**Files:**

- Modify: `package.json` (add `@tanstack/react-query` dependency)
- Create: `src/api/queryClient.ts`
- Modify: `App.tsx:108-120` (wrap with `QueryClientProvider`)
- Modify: `eslint.config.js` (VENDOR map + `no-restricted-syntax` fetch ban + per-home overrides)
- Create: `.claude/rules/api-data.md` (convention doc)
- Modify: `.claude/rules/rules.md` (index the new rule)

**Acceptance Criteria:**

- [ ] `@tanstack/react-query` is in `package.json` dependencies and installed.
- [ ] A singleton `QueryClient` is provided at the app root, inside `<ClerkProvider>`.
- [ ] Raw `fetch` is an ESLint error everywhere except `src/database/connector.ts` and `src/api/**`; `userSearch.ts` is exempted with a `TODO(FE-5)`.
- [ ] `@tanstack/react-query` import is an ESLint error outside `src/hooks/**` and `src/api/**`.
- [ ] `npm run check` passes.

**Verify:** `npm run check` → exit 0.

**Steps:**

- [ ] **Step 1: Add the dependency**

```bash
npm install @tanstack/react-query
```

- [ ] **Step 2: Create the singleton QueryClient**

Create `src/api/queryClient.ts`:

```ts
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
```

- [ ] **Step 3: Provide it at the app root**

In `App.tsx`, add the imports near the existing provider imports (after line 4):

```tsx
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@api/queryClient';
```

Then wrap the tree (replace lines 108-120). Place `QueryClientProvider` inside `ClerkProvider` so query functions can read the Clerk API token:

```tsx
  return (
    <GestureHandlerRootView style={rootStyle}>
      <GluestackUIProvider mode="light">
        <ClerkProvider {...(tokenCache ? { tokenCache } : {})}>
          <QueryClientProvider client={queryClient}>
            <PowerSyncContext.Provider value={database}>
              <ClerkPowerSyncBridge />
              <StatusBar style="auto" />
              <AppNavigator />
            </PowerSyncContext.Provider>
          </QueryClientProvider>
        </ClerkProvider>
      </GluestackUIProvider>
    </GestureHandlerRootView>
  );
}
```

- [ ] **Step 4: Add the `@api` path alias**

The repo requires path aliases in three files. Add `@api/*` → `src/api/*`:

In `tsconfig.json` `compilerOptions.paths`, add: `"@api/*": ["src/api/*"]`.
In `babel.config.js` `module-resolver` `alias`, add: `'@api': './src/api'`.
In `jest.config.js` `moduleNameMapper`, add: `'^@api/(.*)$': '<rootDir>/src/api/$1'`.

(Match the exact formatting of the existing `@hooks`/`@utils` entries in each file.)

- [ ] **Step 5: Add the lint guardrails**

In `eslint.config.js`, add a `tanstackQuery` entry to the `VENDOR` map (after the `secureStore` entry, before the closing `};` at line ~40):

```js
  tanstackQuery: {
    group: ['@tanstack/react-query'],
    message:
      'TanStack Query is the online-REST data layer. Import @tanstack/react-query only in src/hooks/** or src/api/**. Screens/components/utils must consume a hook. See .claude/rules/api-data.md.',
  },
```

In the main TS block, extend the existing `no-restricted-syntax` rule (currently the `StyleSheet.create` ban at line ~185) to also ban raw `fetch`. Replace that rule's array with:

```js
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "CallExpression[callee.object.name='StyleSheet'][callee.property.name='create']",
          message:
            'StyleSheet.create is banned — use tva() + className (NativeWind). See .claude/rules/ui-components.md.',
        },
        {
          selector: "CallExpression[callee.name='fetch']",
          message:
            'Raw fetch is banned for app API work — it belongs in src/api/** (TanStack query/mutation fns) or src/database/connector.ts (PowerSync upload). Consume a TanStack Query hook instead. See .claude/rules/api-data.md.',
        },
      ],
```

Add two per-file overrides in the "Vendor homes" section (after the `src/hooks/**` override at line ~237). These re-allow what each home legitimately needs:

```js
  {
    // The API layer (TanStack query/mutation fns) is the one place app-level
    // fetch + @tanstack/react-query live together.
    files: ['src/api/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': vendorExcept('tanstackQuery'),
      'no-restricted-syntax': 'off',
    },
  },
  {
    // PowerSync upload path: connector legitimately calls fetch to our backend.
    files: ['src/database/connector.ts'],
    rules: { 'no-restricted-syntax': 'off' },
  },
  {
    // TEMPORARY: userSearch.ts predates the TanStack standard (raw fetch).
    // TODO(FE-5 / NEB-153): migrate to src/api/** + TanStack Query and DELETE
    // this exemption. This list is closed — do not add entries.
    files: ['src/utils/userSearch.ts'],
    rules: { 'no-restricted-syntax': 'off' },
  },
```

Update the existing `src/hooks/**` override so hooks may import TanStack Query too. Change its rule from `vendorExcept('powersyncReact')` to `vendorExcept('powersyncReact', 'tanstackQuery')`.

- [ ] **Step 6: Write the convention doc**

Create `.claude/rules/api-data.md`:

```markdown
# API Data Layer

Two data paths, one rule each — both lint-enforced in `eslint.config.js`.

| Data                      | Mechanism                                    | Where it lives                                                         |
| ------------------------- | -------------------------------------------- | ---------------------------------------------------------------------- |
| Synced / offline-readable | PowerSync `useQuery` (`@powersync/react`)    | `src/hooks/**`, `src/database/**`                                      |
| Online REST               | **TanStack Query** (`@tanstack/react-query`) | query/mutation fns in `src/api/**`, exposed as hooks in `src/hooks/**` |

**Rules (hard ESLint errors → fail `npm run check` + CI):**

- Raw `fetch` is banned outside `src/api/**` and `src/database/connector.ts` (PowerSync upload). Do online API work in an `src/api/**` query/mutation function.
- `@tanstack/react-query` may only be imported in `src/hooks/**` and `src/api/**`. Screens/components/utils consume a hook — never call `useQuery`/`useMutation` directly.

The only legal path for online API work: `src/api/**` (fetch allowed) → exposed as a hook → consumed by a screen/component.

**Known exemption (temporary):** `src/utils/userSearch.ts` uses raw `fetch` and predates this standard. It is path-exempted with a `TODO(FE-5)`; NEB-153 migrates it and removes the exemption.
```

Add a row to the table in `.claude/rules/rules.md` (under the existing domain rows):

```markdown
| API Data | `.claude/rules/api-data.md` | Working with online REST / `@tanstack/react-query` / `src/api/**` |
```

- [ ] **Step 7: Verify and commit**

Run: `npm run check`
Expected: exit 0 (lint + format + typecheck + jest all pass).

```bash
git add package.json package-lock.json src/api/queryClient.ts App.tsx eslint.config.js tsconfig.json babel.config.js jest.config.js .claude/rules/api-data.md .claude/rules/rules.md
git commit -m "feat: add TanStack Query foundation + lint hard-check for API work"
```

```json:metadata
{"files": ["package.json", "src/api/queryClient.ts", "App.tsx", "eslint.config.js", "tsconfig.json", "babel.config.js", "jest.config.js", ".claude/rules/api-data.md", ".claude/rules/rules.md"], "verifyCommand": "npm run check", "acceptanceCriteria": ["@tanstack/react-query in deps and installed", "singleton QueryClient provided inside ClerkProvider", "raw fetch banned outside connector.ts + src/api/**; userSearch.ts exempt with TODO(FE-5)", "@tanstack/react-query contained to src/hooks/** + src/api/**", "npm run check passes"]}
```

---

### Task 1: Rewrite `user_connections` schema + Zod (read-only)

**Goal:** Replace the synced table and Zod schema with the normalized read-only pair; remove all status/requester/addressee/blocker/`deleted_at` fields and every write-input shape.

**Files:**

- Modify: `src/database/schema.ts:115-123` (table) and `:158` (drop `ConnectionStatus` re-export)
- Modify: `src/database/schemas/userConnectionSchemas.ts` (full rewrite)
- Modify: `src/database/schemas/index.ts:14-21` (re-exports)
- Test: `src/database/schemas/__tests__/userConnectionSchemas.test.ts` (rewrite)

**Acceptance Criteria:**

- [ ] `user_connections` table is `{user_a_id, user_b_id, inserted_at, updated_at}` only.
- [ ] Zod exposes only `UserConnectionSchema` + `UserConnection` type — no status/create/update schemas.
- [ ] `schemas/index.ts` re-exports only the read-only schema/type.
- [ ] `schema.ts` no longer re-exports `ConnectionStatus`.
- [ ] The rewritten Zod test passes and keeps `src/database/schemas/**` ≥90% coverage.

**Verify:** `npx jest src/database/schemas/__tests__/userConnectionSchemas.test.ts` → PASS.

**Steps:**

- [ ] **Step 1: Rewrite the Zod schema test (red)**

Replace `src/database/schemas/__tests__/userConnectionSchemas.test.ts` entirely:

```ts
import { UserConnectionSchema } from '../userConnectionSchemas';

describe('UserConnectionSchema (read-only synced pair)', () => {
  const validRow = {
    id: 'a0000000-0000-4000-8000-000000000001',
    user_a_id: 'a0000000-0000-4000-8000-000000000002',
    user_b_id: 'a0000000-0000-4000-8000-000000000003',
    inserted_at: '2026-06-08T00:00:00Z',
    updated_at: '2026-06-08T00:00:00Z',
  };

  it('accepts a valid synced row', () => {
    expect(() => UserConnectionSchema.parse(validRow)).not.toThrow();
  });

  it('rejects a non-uuid id', () => {
    expect(() => UserConnectionSchema.parse({ ...validRow, id: 'not-a-uuid' })).toThrow();
  });

  it('rejects a non-uuid participant', () => {
    expect(() => UserConnectionSchema.parse({ ...validRow, user_a_id: 'nope' })).toThrow();
  });

  it('rejects a missing participant', () => {
    const { user_b_id: _omit, ...withoutB } = validRow;
    expect(() => UserConnectionSchema.parse(withoutB)).toThrow();
  });

  it('exposes no write-input schema', () => {
    const mod = require('../userConnectionSchemas');
    expect(mod.CreateUserConnectionInputSchema).toBeUndefined();
    expect(mod.UpdateUserConnectionInputSchema).toBeUndefined();
    expect(mod.ConnectionStatusSchema).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails**

Run: `npx jest src/database/schemas/__tests__/userConnectionSchemas.test.ts`
Expected: FAIL (old schema still has status/create/update exports).

- [ ] **Step 3: Rewrite the Zod schema (green)**

Replace `src/database/schemas/userConnectionSchemas.ts` entirely:

```ts
import { z } from 'zod';

/**
 * Read-only synced row for `user_connections` (the contract's normalized pair).
 * Clients NEVER write this table — all mutations are online REST (FE-2). The
 * pair is normalized server-side (`user_a_id < user_b_id`); direction is not
 * meaningful. `deleted_at` is never synced — removal manifests as the row
 * leaving the bucket, so there is no soft-delete field or input schema here.
 */
export const UserConnectionSchema = z.object({
  id: z.string().uuid(),
  user_a_id: z.string().uuid(),
  user_b_id: z.string().uuid(),
  inserted_at: z.string(),
  updated_at: z.string(),
});

export type UserConnection = z.infer<typeof UserConnectionSchema>;
```

- [ ] **Step 4: Update the schemas barrel**

In `src/database/schemas/index.ts`, replace the `userConnectionSchemas` re-export block (lines ~14-21) with:

```ts
export { UserConnectionSchema, type UserConnection } from './userConnectionSchemas';
```

- [ ] **Step 5: Update the PowerSync table + drop the dead type re-export**

In `src/database/schema.ts`, replace the `userConnections` table (lines 115-123) with:

```ts
const userConnections = new Table({
  user_a_id: column.text,
  user_b_id: column.text,
  inserted_at: column.text,
  updated_at: column.text,
});
```

Then replace the re-export line at the bottom (line ~158):

```ts
// UserConnection type is sourced from Zod schema (single source of truth)
export type { UserConnection } from '@database/schemas/userConnectionSchemas';
```

- [ ] **Step 6: Run the test to confirm it passes**

Run: `npx jest src/database/schemas/__tests__/userConnectionSchemas.test.ts --coverage --collectCoverageFrom='src/database/schemas/**'`
Expected: PASS, and `src/database/schemas/**` lines/branches ≥90%.

- [ ] **Step 7: Commit**

```bash
git add src/database/schema.ts src/database/schemas/userConnectionSchemas.ts src/database/schemas/index.ts src/database/schemas/__tests__/userConnectionSchemas.test.ts
git commit -m "feat: rewrite user_connections schema to normalized read-only pair"
```

```json:metadata
{"files": ["src/database/schema.ts", "src/database/schemas/userConnectionSchemas.ts", "src/database/schemas/index.ts", "src/database/schemas/__tests__/userConnectionSchemas.test.ts"], "verifyCommand": "npx jest src/database/schemas/__tests__/userConnectionSchemas.test.ts", "acceptanceCriteria": ["table is {user_a_id,user_b_id,inserted_at,updated_at}", "Zod exposes only UserConnectionSchema + UserConnection", "barrel + schema.ts re-exports updated; no ConnectionStatus", "schemas test passes at >=90% coverage"]}
```

---

### Task 2: Connector guard — block `user_connections` uploads

**Goal:** Add a `READ_ONLY_TABLES` guard in `uploadCrudEntry` so a stray local CRUD against `user_connections` is skipped before any `fetch`.

**Files:**

- Modify: `src/database/connector.ts` (add guard in `uploadCrudEntry`)
- Test: `src/database/__tests__/connector.test.ts` (create)

**Acceptance Criteria:**

- [ ] A PUT/PATCH/DELETE CRUD entry for `user_connections` is skipped — no `fetch` is issued.
- [ ] A CRUD entry for any other table still issues its `fetch`.

**Verify:** `npx jest src/database/__tests__/connector.test.ts` → PASS.

**Steps:**

- [ ] **Step 1: Write the failing test (red)**

Create `src/database/__tests__/connector.test.ts`:

```ts
import { UpdateType } from '@powersync/react-native';

import { PowerSyncConnector } from '../connector';
import { setClerkTokenGetter } from '../connector';

const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

function entry(table: string) {
  return { op: UpdateType.PUT, table, id: 'row-1', opData: { foo: 'bar' } };
}

// uploadCrudEntry is private; exercise it via the public uploadData path.
function transactionWith(table: string) {
  return {
    crud: [entry(table)],
    complete: jest.fn().mockResolvedValue(undefined),
  };
}

describe('PowerSyncConnector upload guard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setClerkTokenGetter(async () => 'fake.jwt');
    mockFetch.mockResolvedValue({ ok: true, status: 200 });
  });

  it('skips uploads for user_connections (read-only table) — no fetch', async () => {
    const connector = new PowerSyncConnector();
    const tx = transactionWith('user_connections');
    await connector.uploadData({
      getNextCrudTransaction: jest.fn().mockResolvedValue(tx),
    } as never);

    expect(mockFetch).not.toHaveBeenCalled();
    expect(tx.complete).toHaveBeenCalled();
  });

  it('still uploads for a normal table', async () => {
    const connector = new PowerSyncConnector();
    const tx = transactionWith('events');
    await connector.uploadData({
      getNextCrudTransaction: jest.fn().mockResolvedValue(tx),
    } as never);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0]?.[0]).toContain('/api/data/events/row-1');
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails**

Run: `npx jest src/database/__tests__/connector.test.ts`
Expected: FAIL on the first case (fetch IS currently called for `user_connections`).

- [ ] **Step 3: Add the guard (green)**

In `src/database/connector.ts`, add the constant near the top of the file (after the imports, before the `PowerSyncCredentials` interface):

```ts
/**
 * Tables the client may read via sync but must NEVER upload. The contract
 * forbids client writes to `user_connections` (all mutations are online REST,
 * FE-2). This is defense-in-depth: even a stray local write is dropped here
 * before it can hit `/api/data/user_connections/:id`.
 */
const READ_ONLY_TABLES = new Set<string>(['user_connections']);
```

Then, at the very start of `uploadCrudEntry` (after destructuring `entry`), add the guard. Replace:

```ts
  private async uploadCrudEntry(entry: CrudEntry): Promise<void> {
    const { op, table, id, opData } = entry;
```

with:

```ts
  private async uploadCrudEntry(entry: CrudEntry): Promise<void> {
    const { op, table, id, opData } = entry;

    if (READ_ONLY_TABLES.has(table)) {
      console.warn(
        `[PowerSync] Blocked local write to read-only table "${table}" (${id}) — skipping. Connections mutations are online REST (FE-2).`
      );
      return;
    }
```

- [ ] **Step 4: Run the test to confirm it passes**

Run: `npx jest src/database/__tests__/connector.test.ts`
Expected: PASS (both cases).

- [ ] **Step 5: Commit**

```bash
git add src/database/connector.ts src/database/__tests__/connector.test.ts
git commit -m "feat: block client uploads to user_connections in the connector"
```

```json:metadata
{"files": ["src/database/connector.ts", "src/database/__tests__/connector.test.ts"], "verifyCommand": "npx jest src/database/__tests__/connector.test.ts", "acceptanceCriteria": ["user_connections CRUD is skipped — no fetch", "other tables still upload", "connector test passes"]}
```

---

### Task 3: Reduce `useConnections` to reads-only

**Goal:** Re-key the connection hooks to the normalized pair, return only the connected list, and remove the status/pending queries. Resolve the other participant in both directions.

**Files:**

- Modify: `src/hooks/useConnections.ts` (`useConnections`, `useConnectionWith`, `HydratedConnection`)
- Modify: `src/hooks/index.ts` (re-export unchanged; `HydratedConnection` reshaped)
- Test: `src/hooks/__tests__/useConnections.test.ts` (rewrite the connection-specific cases)

**Acceptance Criteria:**

- [ ] `useConnections` returns `{ connections, isLoading }` from synced pairs; resolves `other_user_id` correctly when me = `user_a` AND when me = `user_b`.
- [ ] `useConnectionWith` returns `{ id } | null` (presence = connected), re-keyed to the pair, no `status`.
- [ ] `HydratedConnection` has no `requester_id/addressee_id/status/blocker_id`.
- [ ] `useSharedCalendarCount`, `useSharedCalendars`, `useUserProfile` are unchanged and still pass.

**Verify:** `npx jest src/hooks/__tests__/useConnections.test.ts` → PASS.

**Steps:**

- [ ] **Step 1: Rewrite the connection-specific tests (red)**

In `src/hooks/__tests__/useConnections.test.ts`, replace the `useConnections` and `useConnectionWith` `describe` blocks (keep the `useSharedCalendarCount`, `useSharedCalendars`, `useUserProfile` blocks as-is) with:

```ts
describe('useConnections (reads-only connected list)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns the connected list and resolves other_user_id when me = user_a', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: [
        { id: '1', other_user_id: 'friend', first_name: 'Joe', last_name: 'B', avatar_color: null },
      ],
      isLoading: false,
    });
    const { result } = renderHook(() => useConnections('me'));
    expect(result.current.connections).toHaveLength(1);
    expect(result.current.connections[0]?.other_user_id).toBe('friend');
  });

  it('binds the query with me on both sides of the pair', () => {
    (useQuery as jest.Mock).mockReturnValue({ data: [], isLoading: false });
    renderHook(() => useConnections('me'));
    expect(useQuery as jest.Mock).toHaveBeenCalledWith(expect.stringContaining('user_a_id'), [
      'me',
      'me',
      'me',
      'me',
    ]);
  });

  it('is inert (no rows) when currentUserId is undefined', () => {
    (useQuery as jest.Mock).mockReturnValue({ data: [], isLoading: false });
    const { result } = renderHook(() => useConnections(undefined));
    expect(result.current.connections).toHaveLength(0);
  });
});

describe('useConnectionWith (presence = connected)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns null when either id is undefined', () => {
    (useQuery as jest.Mock).mockReturnValue({ data: [], isLoading: false });
    const { result } = renderHook(() => useConnectionWith('me', undefined));
    expect(result.current).toBeNull();
  });

  it('binds both directions of the pair', () => {
    (useQuery as jest.Mock).mockReturnValue({ data: [], isLoading: false });
    renderHook(() => useConnectionWith('me', 'them'));
    expect(useQuery as jest.Mock).toHaveBeenCalledWith(expect.stringContaining('user_a_id = ?'), [
      'me',
      'them',
      'them',
      'me',
    ]);
  });

  it('returns the connection id when a row exists', () => {
    (useQuery as jest.Mock).mockReturnValue({ data: [{ id: 'c1' }], isLoading: false });
    const { result } = renderHook(() => useConnectionWith('me', 'them'));
    expect(result.current?.id).toBe('c1');
  });
});
```

- [ ] **Step 2: Run to confirm failure**

Run: `npx jest src/hooks/__tests__/useConnections.test.ts`
Expected: FAIL (old hook returns `pendingIncoming/accepted/pendingOutgoing`, queries reference `requester_id`).

- [ ] **Step 3: Rewrite the hooks (green)**

In `src/hooks/useConnections.ts`, replace the `HydratedConnection` type, `useConnections`, and `useConnectionWith` (lines 1-111) with the following. **Leave `useSharedCalendarCount`, `useSharedCalendars`, and `useUserProfile` (lines 113-183) untouched.**

```ts
import { useQuery } from '@powersync/react';
import { useMemo } from 'react';

export type HydratedConnection = {
  id: string;
  // Other party (resolved from the normalized pair) + their synced profile.
  other_user_id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_color: string | null;
};

/**
 * Reactive list of the current user's active connections, read from the synced
 * normalized `user_connections` pair. Direction is not meaningful: the other
 * party is resolved as `user_a_id === me ? user_b_id : user_a_id`. Pending
 * requests are NOT here — they are online REST (FE-2/FE-4).
 */
export function useConnections(currentUserId: string | undefined) {
  const connected = useQuery<HydratedConnection>(
    currentUserId
      ? `SELECT c.id,
                CASE WHEN c.user_a_id = ? THEN c.user_b_id ELSE c.user_a_id END AS other_user_id,
                u.first_name, u.last_name, u.avatar_color
         FROM user_connections c
         JOIN users u ON u.id = (CASE WHEN c.user_a_id = ? THEN c.user_b_id ELSE c.user_a_id END)
         WHERE (c.user_a_id = ? OR c.user_b_id = ?)
         ORDER BY u.last_name ASC, u.first_name ASC`
      : `SELECT 1 WHERE 0`,
    currentUserId ? [currentUserId, currentUserId, currentUserId, currentUserId] : []
  );

  return useMemo(
    () => ({ connections: connected.data, isLoading: connected.isLoading }),
    [connected.data, connected.isLoading]
  );
}

/**
 * The active connection row between the current user and `otherUserId`, either
 * direction. Presence of a row means "connected". The `connection_id` is NOT
 * stable across a remove → re-add cycle (contract) — resolve it fresh, never
 * cache it as durable.
 */
export function useConnectionWith(
  currentUserId: string | undefined,
  otherUserId: string | undefined
) {
  const { data } = useQuery<{ id: string }>(
    currentUserId && otherUserId
      ? `SELECT id
         FROM user_connections
         WHERE (user_a_id = ? AND user_b_id = ?)
            OR (user_a_id = ? AND user_b_id = ?)
         LIMIT 1`
      : `SELECT 1 WHERE 0`,
    currentUserId && otherUserId ? [currentUserId, otherUserId, otherUserId, currentUserId] : []
  );

  return data[0] ?? null;
}
```

- [ ] **Step 4: Run to confirm pass**

Run: `npx jest src/hooks/__tests__/useConnections.test.ts`
Expected: PASS (all blocks, including the unchanged shared-calendar/profile ones).

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useConnections.ts src/hooks/__tests__/useConnections.test.ts
git commit -m "feat: reduce useConnections to reads-only normalized pair"
```

```json:metadata
{"files": ["src/hooks/useConnections.ts", "src/hooks/__tests__/useConnections.test.ts"], "verifyCommand": "npx jest src/hooks/__tests__/useConnections.test.ts", "acceptanceCriteria": ["useConnections returns {connections,isLoading} resolving other_user_id both directions", "useConnectionWith returns {id}|null re-keyed to the pair", "HydratedConnection drops status/requester/addressee/blocker", "shared-calendar/profile hooks unchanged and passing"]}
```

---

### Task 4: Delete the client write path

**Goal:** Remove `src/utils/connections.ts` and its barrel re-export and test — the six mutation functions move to REST in FE-2.

**Files:**

- Delete: `src/utils/connections.ts`
- Delete: `src/utils/__tests__/connections.test.ts`
- Modify: `src/utils/index.ts` (drop the `./connections` re-export)

**Acceptance Criteria:**

- [ ] `src/utils/connections.ts` and its test no longer exist.
- [ ] `src/utils/index.ts` no longer re-exports any connection mutation.
- [ ] `npm run knip` reports no new unused-export findings for these symbols.

**Verify:** `npx jest src/utils/ && npm run knip` → both exit 0.

**Steps:**

- [ ] **Step 1: Delete the files**

```bash
git rm src/utils/connections.ts src/utils/__tests__/connections.test.ts
```

- [ ] **Step 2: Drop the barrel re-export**

In `src/utils/index.ts`, remove the entire `export { sendConnectionRequest, ... } from './connections';` block (lines 3-10). The file should keep `secureStorage`, `searchUsers`/`RateLimitedError`, and `displayName`:

```ts
// Barrel export for utility functions
export { secureStorage } from './secureStorage';
export { searchUsers, RateLimitedError } from './userSearch';
export { displayName } from './displayName';
```

- [ ] **Step 3: Verify nothing else imports the deleted symbols**

Run: `grep -rn "from '@utils/connections'\|sendConnectionRequest\|acceptConnection\|declineConnection\|cancelSentRequest\|removeConnection\|blockUser" src --include='*.ts' --include='*.tsx'`
Expected: matches ONLY inside the four screens (handled in Task 5). No other hits.

- [ ] **Step 4: Verify utils tests + knip**

Run: `npx jest src/utils/ && npm run knip`
Expected: jest passes (remaining util tests), knip exits 0 (no new unused exports).
(Note: knip / a full typecheck still sees the screens importing the removed symbols until Task 5 — if knip flags those screen imports, that is expected and cleared by Task 5.)

- [ ] **Step 5: Commit**

```bash
git add src/utils/index.ts
git commit -m "feat: remove client-side connection write path (moves to REST in FE-2)"
```

```json:metadata
{"files": ["src/utils/connections.ts", "src/utils/__tests__/connections.test.ts", "src/utils/index.ts"], "verifyCommand": "npx jest src/utils/", "acceptanceCriteria": ["connections.ts + its test deleted", "barrel no longer re-exports mutations", "only the four screens still reference the removed symbols (cleared in Task 5)"]}
```

---

### Task 5: Neutralize the four People-tab screens (green gate)

**Goal:** Make the four screens compile against the new data layer with minimal placeholders, so `npm run check` is fully green. Real contract rewires are FE-4/5/6/7.

**Files:**

- Modify: `src/screens/people/ConnectionsScreen.tsx`
- Modify: `src/screens/people/AddConnectionScreen.tsx`
- Modify: `src/screens/people/PersonProfileScreen.tsx`
- Modify: `src/screens/ProfileScreen.tsx`
- Test: `src/screens/people/__tests__/ConnectionsScreen.test.tsx`, `AddConnectionScreen.test.tsx`, `PersonProfileScreen.test.tsx`, `src/screens/__tests__/ProfileScreen.test.tsx` (rewrite to neutralized behavior)

**Acceptance Criteria:**

- [ ] No screen imports a deleted mutation (`@utils/connections`) or a removed hook field (`pendingIncoming/pendingOutgoing/accepted`, `connection.status`).
- [ ] ConnectionsScreen renders the connected list from `useConnections().connections`; pending sections removed.
- [ ] AddConnectionScreen's Connect/Accept actions are disabled placeholders ("online-only — coming soon"); search may stay but performs no mutation.
- [ ] PersonProfileScreen shows Connected/not from `useConnectionWith`; Remove/Block are disabled "coming soon" affordances.
- [ ] ProfileScreen drops the pending badge; keeps the Connections row + navigation.
- [ ] Screen tests rewritten to the neutralized behavior; `npm run check` passes.

**Verify:** `npm run check` → exit 0.

**Steps:**

- [ ] **Step 1: ConnectionsScreen** (`src/screens/people/ConnectionsScreen.tsx`)
  - Remove the import `import { acceptConnection, declineConnection, cancelSentRequest } from '@utils/connections';` (line 14).
  - Change the hook destructure (line 36) from `const { pendingIncoming, accepted, pendingOutgoing, isLoading } = useConnections(user?.id);` to:

    ```tsx
    const { connections, isLoading } = useConnections(user?.id);
    ```

  - Delete the `runMutation` helper and the entire "Requests" (`pendingIncoming`) and "Sent" (`pendingOutgoing`) JSX sections (lines ~94-181 region) and any handlers calling the removed functions.
  - Update the empty-state condition (line 73) to `connections.length === 0`.
  - Render the connected list by mapping `connections` (each is a `HydratedConnection` with `other_user_id`, `first_name`, `last_name`, `avatar_color`); reuse the existing `hydratedToUser` helper (update it to read the new fields) and the existing row → `navigation.navigate('PersonProfile', { userId: c.other_user_id })`.

- [ ] **Step 2: AddConnectionScreen** (`src/screens/people/AddConnectionScreen.tsx`)
  - Remove `import { sendConnectionRequest, acceptConnection } from '@utils/connections';` (line 22) and the `useConnections` import if only used for pending fields.
  - Remove the `stateByUserId` `useMemo` that reads `pendingIncoming/accepted/pendingOutgoing` (lines ~51-72) and any `await sendConnectionRequest(...)` / `await acceptConnection(...)` calls (lines ~115, ~128).
  - Replace the per-row trailing action with a disabled placeholder button labeled `Connect` that, on press, shows the standard "coming soon" message. Add this helper near the other small components and use it as the trailing action:

    ```tsx
    function ComingSoonAction() {
      return (
        <Box className="rounded-full bg-brand-muted px-3 py-1.5 opacity-50">
          <Text className="text-[13px] font-medium text-brand-text">Connect</Text>
        </Box>
      );
    }
    ```

    (Search itself may remain via `searchUsers`; just ensure no mutation is invoked.)

- [ ] **Step 3: PersonProfileScreen** (`src/screens/people/PersonProfileScreen.tsx`)
  - Remove `import { removeConnection, blockUser } from '@utils/connections';` (line 21).
  - `useConnectionWith` now returns `{ id } | null`. Replace every `connection?.status === 'accepted'` / `connection?.status` reference: treat `connection != null` as **connected**. Simplify `StatusPill` to take a boolean `connected` and render the existing "Connected" pill when true, nothing when false (drop the `pending` branch).
  - Replace the Remove/Block handlers (the `Alert` flows calling `removeConnection` / `blockUser`, lines ~109-145) with disabled affordances: keep the "Remove Connection" and "Block" rows but render them at `opacity-50`, and on press show a "coming soon (FE-6)" message instead of mutating.

- [ ] **Step 4: ProfileScreen** (`src/screens/ProfileScreen.tsx`)
  - Change the destructure (line 72) from `const { pendingIncoming, accepted } = useConnections(me?.id);` to:

    ```tsx
    const { connections } = useConnections(me?.id);
    ```

  - Remove the pending-count badge JSX that reads `pendingIncoming.length` (lines ~135-139). Keep the `Connections` row and its `handleConnectionsRowTap` navigation. If a count is desired, use `connections.length`; otherwise render no badge.

- [ ] **Step 5: Rewrite the four screen tests**

  Each existing screen test asserts old-model behavior (pending sections, `sendConnectionRequest`, `connection.status`) and will fail. Rewrite each to the neutralized behavior:
  - **ConnectionsScreen.test.tsx** — mock `@hooks/useConnections` to return `{ connections: [{ id, other_user_id, first_name, last_name, avatar_color }], isLoading: false }`; assert the connected row renders and tapping it navigates to `PersonProfile` with `other_user_id`. Remove assertions about pending/accept/decline.
  - **AddConnectionScreen.test.tsx** — mock `@utils/userSearch`'s `searchUsers`; assert results render with a disabled `Connect` placeholder and that no mutation import is referenced. Remove `sendConnectionRequest`/`stateByUserId` assertions.
  - **PersonProfileScreen.test.tsx** — mock `useConnectionWith` to return `{ id: 'c1' }` (connected) and `null` (not); assert the Connected pill shows/hides; assert Remove/Block are disabled and do not call any mutation.
  - **ProfileScreen.test.tsx** — mock `useConnections` to return `{ connections: [...] }`; assert the Connections row renders and navigates; assert no pending badge is shown.

  Follow the testing rule: mock `@powersync/react` / `@hooks/*` per-test; mock `@react-navigation/native` (include `getParent()` where drawer actions are dispatched).

- [ ] **Step 6: Run the full gate**

Run: `npm run check`
Expected: exit 0 — lint (incl. the new fetch/TanStack rules), format, typecheck, and all jest suites pass.

- [ ] **Step 7: Commit**

```bash
git add src/screens/people/ConnectionsScreen.tsx src/screens/people/AddConnectionScreen.tsx src/screens/people/PersonProfileScreen.tsx src/screens/ProfileScreen.tsx src/screens/people/__tests__/ConnectionsScreen.test.tsx src/screens/people/__tests__/AddConnectionScreen.test.tsx src/screens/people/__tests__/PersonProfileScreen.test.tsx src/screens/__tests__/ProfileScreen.test.tsx
git commit -m "feat: neutralize People-tab screens against new connections data layer"
```

```json:metadata
{"files": ["src/screens/people/ConnectionsScreen.tsx", "src/screens/people/AddConnectionScreen.tsx", "src/screens/people/PersonProfileScreen.tsx", "src/screens/ProfileScreen.tsx", "src/screens/people/__tests__/ConnectionsScreen.test.tsx", "src/screens/people/__tests__/AddConnectionScreen.test.tsx", "src/screens/people/__tests__/PersonProfileScreen.test.tsx", "src/screens/__tests__/ProfileScreen.test.tsx"], "verifyCommand": "npm run check", "acceptanceCriteria": ["no screen imports deleted mutations or removed hook fields", "ConnectionsScreen renders connected list, pending removed", "AddConnectionScreen actions disabled placeholders", "PersonProfileScreen connected-from-presence; Remove/Block disabled", "ProfileScreen pending badge dropped; Connections row kept", "screen tests rewritten; npm run check passes"]}
```

---

## Final verification

After Task 5, from the `nebbler/` submodule root:

```bash
npm run check          # lint + format + typecheck + jest — must be green
npm run knip           # no unused exports/files/deps
```

Then the FE-1 branch is ready to hold until the BE gate (NEB-138 + sync-rule change) clears — **do not merge before then** (synced columns must match the contract; see spec → Constraints / risks).
