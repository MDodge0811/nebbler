# FE-1 — Connections data-model rewrite + sync alignment + remove client writes

**Linear:** [NEB-149](https://linear.app/nebbler/issue/NEB-149) (parent epic [NEB-148](https://linear.app/nebbler/issue/NEB-148))
**Source of truth:** [Connections API Contract (BE ↔ FE)](https://linear.app/nebbler/document/connections-api-contract-be-fe-efaede5e5b39)
**Date:** 2026-06-08

> Build to the contract, not to the current code. Where this spec and the contract disagree, the contract wins.

## Problem

The People-tab frontend is shipped on the **old** connections model: a single `user_connections`
status table (`requester_id`/`addressee_id`/`status`/`blocker_id`), client-side PowerSync writes for
every mutation (`src/utils/connections.ts`), and pending requests served from synced `status='pending'`
rows. The redesigned contract inverts the data layer: `user_connections` becomes a normalized
synced **pair** (`user_a_id`, `user_b_id`, timestamps), all mutations move to **online-only REST**
(clients never upload `user_connections`), and pending requests move to a non-synced
`connection_requests` REST resource.

FE-1 is the **foundation slice**: rewrite the local data model, sever the forbidden client-write path,
reduce the connection hooks to reads-only, and stand up the API-layer foundation that the downstream
REST stories (FE-2…FE-7) build on. It does **not** implement any REST calls — that is FE-2.

## Scope

### 1. Synced schema — `src/database/schema.ts`

Replace the `userConnections` table with the normalized pair. Drop `requester_id`, `addressee_id`,
`status`, `blocker_id`, **and `deleted_at`** — the device only ever holds active rows (the sync rules
filter `deleted_at IS NULL`), so removal manifests as the row disappearing from sync, not a flag flip.

```ts
const userConnections = new Table({
  user_a_id: column.text,
  user_b_id: column.text,
  inserted_at: column.text,
  updated_at: column.text,
});
```

Also remove the now-dead `ConnectionStatus` type re-export at the bottom of the file.

### 2. Zod — `src/database/schemas/userConnectionSchemas.ts`

Collapse to a single **read-only** synced-row schema matching the new columns. Delete
`ConnectionStatusSchema`, `CreateUserConnectionInputSchema`, `UpdateUserConnectionInputSchema`, and the
`ConnectionStatus` type — clients never write this table, so there is no input shape. Update the
re-exports in `src/database/schemas/index.ts` accordingly.

### 3. Kill the client write path

- **Delete `src/utils/connections.ts`** entirely (`sendConnectionRequest`, `acceptConnection`,
  `declineConnection`, `cancelSentRequest`, `removeConnection`, `blockUser`) — these move to the REST
  client in FE-2. Remove its re-export from `src/utils/index.ts` and delete its test file.
- **Connector guard (defense-in-depth)** — `src/database/connector.ts` `uploadCrudEntry` skips any CRUD
  whose `table` is in a `READ_ONLY_TABLES` set (`user_connections`) before it reaches `fetch`, so a
  stray local write can never reach `/api/data/user_connections/:id`.

### 4. Reads-only hooks — `src/hooks/useConnections.ts`

- `useConnections(currentUserId)` → returns only the **connected list** `{ connections, isLoading }`.
  Re-keyed to the pair; the other participant resolved as
  `CASE WHEN user_a_id = me THEN user_b_id ELSE user_a_id END`. The pending incoming/outgoing queries
  are removed (pending moves to REST in FE-2/FE-4). `HydratedConnection` loses
  `requester_id`/`addressee_id`/`status`/`blocker_id`.
- `useConnectionWith(currentUserId, otherUserId)` → simplified to "is there a connection row, and its
  `connection_id`" (presence = connected), re-keyed to the pair, no `status`. Resolve the id fresh each
  render (contract: `connection_id` is not stable across a remove → re-add cycle).
- `useSharedCalendarCount`, `useSharedCalendars`, `useUserProfile` → **unchanged** (they read
  `calendar_members`/`users`, not `user_connections`).

### 5. TanStack Query foundation (API-layer standard)

TanStack Query is not yet in the project. FE-1 stands up the foundation so every online REST consumer
downstream uses one pattern:

- Add `@tanstack/react-query` to `package.json`.
- Create a singleton `QueryClient` and wrap the app in `QueryClientProvider` at the root (`App.tsx`),
  inside `<ClerkProvider>` so query functions can read the Clerk-issued API token.
- Document the convention (new `.claude/rules/` entry or extension of the PowerSync rule):
  **PowerSync `useQuery` for synced/offline-readable data; TanStack Query for all online REST.**

This is a deliberate expansion beyond NEB-149's literal data-layer scope, taken because FE-1 is the
foundation slice and FE-2 should drop its `connection-requests` client straight onto the standard.
Recorded as a decision on NEB-149.

### 6. Minimal screen neutralization (keep `npm run check` green)

The four screens consuming the old data layer must keep compiling; their real contract rewires are the
downstream stories (FE-4/5/6/7).

- **ConnectionsScreen** — render the connected list from the new hook; drop the pending Requests/Sent
  sections and their accept/decline/cancel handlers.
- **AddConnectionScreen** — search + send are REST (FE-5); disable the action behind an
  "online-only, coming soon" placeholder; drop deleted-fn and pending-field usage.
- **PersonProfileScreen** — connection presence from `useConnectionWith`; simplify the status pill to
  Connected/not; Remove & Block become disabled "coming soon" affordances (matches the contract — Block
  is disabled-only until NEB-139).
- **ProfileScreen** — drop the pending-count badge (no local data source now); keep the Connections row
  and its navigation.

## Out of scope (downstream)

- REST client + relationship helper, `connection-requests` (FE-2).
- Online-required mutation UX pattern (FE-3).
- Full screen rewires (FE-4/5/6/7).
- `username` / basic-info changes (NEB-143, surfaced in FE-5 search rows).
- Migrating existing `src/utils/userSearch.ts` raw-fetch onto TanStack Query (FE-5 follow-up).

## Testing (gate: `npm run check` green — lint + format + typecheck + jest)

- Rewrite `src/database/schemas/__tests__/userConnectionSchemas.test.ts` to the new schema (valid row +
  rejections; assert no write-input shape). Keeps `src/database/schemas/**` ≥90% coverage.
- Rewrite `src/hooks/__tests__/useConnections.test.ts`: assert `useConnections` resolves the other
  participant correctly in **both** directions (me = `user_a`, me = `user_b`); `useConnectionWith` binds
  both directions and returns `id | null`. Keep the unchanged shared-calendar/profile tests.
- **Delete** `src/utils/__tests__/connections.test.ts` (the functions are gone).
- **New connector test**: a local CRUD op against `user_connections` is skipped — no `fetch` to
  `/api/data/user_connections/...`. Mock `@powersync/react` per the PowerSync testing rule.

## Constraints / risks

- **Hard BE dependency.** Blocked by NEB-138 + the sync-rule change emitting `user_a_id/user_b_id` and
  no longer syncing pending rows. FE-1 can be built and unit-tested now (mocked PowerSync) but **cannot
  merge** until the synced columns match the contract, and cannot be integration-tested against real
  sync until then.
- **Schema change** in an alpha app with no real users — acceptable to change without migration.
- The stale People-tab superpowers artifacts named in NEB-149 (`2026-05-27-people-tab-foundation*`,
  `2026-05-31-people-tab-screens*`) **do not exist** anywhere in the submodule. This spec + the
  forthcoming plan are the "regeneration"; there is nothing to delete.

## Acceptance criteria

- [ ] `user_connections` is `{user_a_id, user_b_id, timestamps}` — no status/requester/addressee/blocker/`deleted_at`.
- [ ] Zod schema matches and exposes no write-input shape.
- [ ] No code path issues a local write to `user_connections`; the connector guards against it (test covers it).
- [ ] Connections list reads the normalized pair and resolves the other participant in both directions (test covers it).
- [ ] `@tanstack/react-query` added; `QueryClientProvider` at the app root; convention documented.
- [ ] Old-model test files rewritten/removed; `src/database/schemas/**` ≥90%; `npm run check` passes.
