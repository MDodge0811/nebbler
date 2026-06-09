# NEB-150 [FE-2] connection-requests REST client + relationship helper — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:subagent-driven-development (recommended) or superpowers-extended-cc:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the online REST data layer for connection mutations/request-lists, exposed via TanStack Query hooks, plus a UI-agnostic relationship helper — all validated against the [Connections API Contract](https://linear.app/nebbler/document/connections-api-contract-be-fe-efaede5e5b39).

**Architecture (follows the repo's lint-enforced online-REST standard — `.claude/rules/api-data.md`):** Zod schemas in `src/database/schemas/`; the relationship helper is a pure function in `src/utils/`. Online REST lives in **`src/api/connections.ts`** — async functions that call `fetch` (sanctioned in `src/api/**`, **no eslint exemption**) with a Clerk bearer token from `getApiToken()`, validate responses with Zod, and throw typed errors mapped from the canonical NEB-147 error envelope. Those functions are exposed as **TanStack Query** hooks (`@tanstack/react-query`, v5) in `src/hooks/`, which screens/components (FE-3..FE-7) consume. All requests are online-only.

> **Correction vs. the Linear issue text:** NEB-150 says "new `src/utils/connectionsApi.ts` … like `userSearch.ts`." That predates / conflicts with the repo's now-enforced standard. `userSearch.ts`'s raw-`fetch` exemption is explicitly TEMPORARY (`TODO(FE-5 / NEB-153): migrate to src/api/** + TanStack Query and DELETE this exemption`). We do **not** add another `src/utils` + `no-restricted-syntax: off` exemption; we put the client in `src/api/**` (its sanctioned home) and wrap it in TanStack hooks. The Zod schemas (Tasks 1–2) and the pure relationship helper (Task 3) are unaffected by this correction.

**Tech Stack:** TypeScript, Zod, TanStack Query v5.101 (`QueryClientProvider` already mounted in `App.tsx` under `<ClerkProvider>`), Jest + `@testing-library/react-native` `renderHook` (`fetch`/`getApiToken`/api-module mocked), eslint-plugin-boundaries (`api`/`hook` layers).

---

## Context the engineer needs (read first)

- **`fetch` pattern to mirror (logic only):** `nebbler/src/utils/userSearch.ts` and its test show the bearer-header fetch + Zod-`.parse()` + custom `Error` subclass shape. Reuse the _logic_, but the new client lives in `src/api/`, not `src/utils/`, and needs **no** exemption.
- **Base URL:** `import { powersyncConfig } from '@constants/config'` → `powersyncConfig.backendUrl`.
- **Auth token:** `import { getApiToken } from '@database/index'` → `Promise<string | null>` (Clerk JWT).
- **Canonical error envelope (NEB-147)** is already modeled: `ApiErrorResponseSchema` in `src/database/schemas/apiSchemas.ts` → `{ error: { code, message, details? } }`. Discriminate typed errors by HTTP status + `error.code`.
- **Boundaries (`eslint.config.js`, lines ~337-343):** `{ from: ['api'], allow: ['api','type','constant','util'] }` and `{ from: ['hook'], allow: ['hook','type','constant','util','data','api'] }`. ⚠️ **`api → data` is NOT currently allowed**, but `src/api/connections.ts` must import `@database/schemas` (Zod, `data`) and `@database/index` (`getApiToken`, `data`). **Task 4 adds `data` to the `api` allow-list** — the same edge `util` already has (how `userSearch.ts` works today). `hook → api` is already allowed, so the hooks can import `@api/connections`.
- **`fetch` is sanctioned in `src/api/**`:** `eslint.config.js`(~lines 258-280) bans raw`fetch`globally but the block keyed to`files: ['src/api/**/*.{ts,tsx}']`re-allows it. So`src/api/connections.ts`needs no exemption.`@tanstack/react-query`is importable only in`src/hooks/**`+`src/api/**`.
- **TanStack v5 (`^5.101`):** object syntax (`useQuery({ queryKey, queryFn })`, `useMutation({ mutationFn })`), `isPending` (not `isLoading`), `error: Error | null`. `queryClient` singleton at `@api/queryClient` (`retry: 1`, `staleTime: 30_000`); `QueryClientProvider` already in `App.tsx`.
- **Coverage gates (`nebbler/jest.config.js`):** `src/database/schemas/**` ≥90% all metrics; `src/utils/**` ≥90% functions/lines/statements, ≥65% branches; `src/hooks/**` ≥30% functions/≥50% lines (low — tracked debt). `src/api/**` has **no** threshold yet (do not add one — `queryClient.ts` is untested config and would drag a glob threshold below 90%). Write thorough api tests regardless.
- **Gate command:** `npm run check` = `lint && format:check && typecheck && test`. Run from `nebbler/`.

### Contract shapes (authoritative — do NOT guess)

Relationship object (on search results & profile):

```jsonc
"relationship": {
  "state": "none" | "outgoing_pending" | "incoming_pending" | "connected",
  "request_id": "<uuid|null>",     // present for *_pending
  "connection_id": "<uuid|null>"   // present for connected
}
```

Basic user (everywhere a user appears; **never includes email**): `{ id, username, first_name, last_name, avatar_color }`.

`GET /api/connection-requests` → `{ incoming: Item[], outgoing: Item[] }`, `Item = { id, user: BasicUser, requested_at }`.

### ⚠️ Contract-drift flags (confirm against BE NEB-138 before merge; do not block implementation)

1. **Exact 409 `error.code` strings.** The contract names `inbound_request_exists` explicitly (we MUST get this one right — it drives the FE-5 Accept handoff). The codes for "already connected" and "duplicate outgoing request" are **assumed** to be `already_connected` and `duplicate_request`. The error-mapping `switch` is written so these are the only two strings to adjust if BE differs.
2. **`POST /api/connection-requests` 201 body.** The contract says "201 with the created request" but does not pin the body shape. `sendRequest` parses a tolerant `{ id, requested_at }` (extra keys stripped by Zod). Adjust if BE returns less.
3. **`connection_id` is not durable.** Re-connecting after a removal yields a new row/id (contract "Deletion model"). The helper never caches it; callers must read it from the latest payload/synced row. This is a usage note for FE-4..FE-6, enforced by not storing it here.

---

## File structure

| File                                                              | Action | Responsibility                                                                                                                                                   |
| ----------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/database/schemas/apiSchemas.ts`                              | Modify | Add `RelationshipStateSchema`, `RelationshipSchema`, `BasicUserSchema`; recompose `UserSearchResultSchema`; add `UserProfileResponseSchema`.                     |
| `src/database/schemas/connectionRequestSchemas.ts`                | Create | `ConnectionRequestSchema`, `ConnectionRequestItemSchema`, `ConnectionRequestListResponseSchema`.                                                                 |
| `src/database/schemas/index.ts`                                   | Modify | Re-export all new schemas + inferred types.                                                                                                                      |
| `src/database/schemas/__tests__/apiSchemas.test.ts`               | Create | Cover relationship/basic-user/profile + extended search schema (≥90%).                                                                                           |
| `src/database/schemas/__tests__/connectionRequestSchemas.test.ts` | Create | Cover request item/list/created schemas (≥90%).                                                                                                                  |
| `src/utils/__tests__/userSearch.test.ts`                          | Modify | Update mock users to include now-required `username` + `relationship`.                                                                                           |
| `src/utils/relationship.ts`                                       | Create | `RelationshipAction`, `relationshipToAction`, `otherParticipant`.                                                                                                |
| `src/utils/__tests__/relationship.test.ts`                        | Create | All 4 states → action; `otherParticipant` both directions; invariant violations.                                                                                 |
| `src/api/connections.ts`                                          | Create | Typed errors + `authedFetch`/`toTypedError` + `sendRequest`/`listRequests`/`resolveRequest`/`removeConnection`/`getUserProfile`. Raw `fetch`, **no exemption**.  |
| `src/api/__tests__/connections.test.ts`                           | Create | Success + every typed-error path; bearer-token assertions (mock `fetch` + `getApiToken`).                                                                        |
| `eslint.config.js`                                                | Modify | Add `data` to the `api` boundary allow-list (so `src/api/**` may import schemas + `getApiToken`).                                                                |
| `src/hooks/useConnectionsApi.ts`                                  | Create | TanStack hooks wrapping the api fns: `connectionsKeys`, `useConnectionRequests`, `useUserProfile`, `useSendRequest`, `useResolveRequest`, `useRemoveConnection`. |
| `src/hooks/__tests__/useConnectionsApi.test.tsx`                  | Create | `renderHook` + `QueryClientProvider` wrapper; mock `@api/connections`; assert fn called + query/mutation state + invalidation.                                   |
| `src/hooks/index.ts`                                              | Modify | Re-export the new hooks (if the barrel lists hooks).                                                                                                             |

All paths are relative to `nebbler/`.

---

### Task 1: Relationship, basic-user & profile schemas

**Goal:** Extend `apiSchemas.ts` with the relationship/basic-user building blocks, recompose `UserSearchResultSchema` to add `username` + `relationship`, add `UserProfileResponseSchema`, and keep the existing `userSearch` test green.

**Files:**

- Modify: `src/database/schemas/apiSchemas.ts`
- Modify: `src/database/schemas/index.ts`
- Modify: `src/utils/__tests__/userSearch.test.ts` (mock data now needs `username` + `relationship`)
- Test: `src/database/schemas/__tests__/apiSchemas.test.ts` (create)

**Acceptance Criteria:**

- [ ] `RelationshipStateSchema` enumerates exactly `none | outgoing_pending | incoming_pending | connected`.
- [ ] `RelationshipSchema` = `{ state, request_id: uuid|null, connection_id: uuid|null }`.
- [ ] `UserSearchResultSchema` now requires `username` (string) and `relationship`; `UserProfileResponseSchema` exists with the same shape.
- [ ] `BasicUserSchema` (no relationship) is exported for reuse by request-list items.
- [ ] `index.ts` re-exports every new schema + type.
- [ ] `userSearch.test.ts` passes with updated mocks; `src/database/schemas/**` coverage ≥90%.

**Verify:** `cd nebbler && npx jest src/database/schemas/__tests__/apiSchemas.test.ts src/utils/__tests__/userSearch.test.ts && npx tsc --noEmit` → all pass.

**Steps:**

- [ ] **Step 1: Write failing schema tests** — `src/database/schemas/__tests__/apiSchemas.test.ts`

```typescript
import {
  RelationshipSchema,
  RelationshipStateSchema,
  BasicUserSchema,
  UserSearchResultSchema,
  UserProfileResponseSchema,
} from '@database/schemas';

const basicUser = {
  id: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
  username: 'alice',
  first_name: 'Alice',
  last_name: 'Smith',
  avatar_color: '#00DB74',
};

const relationship = { state: 'none', request_id: null, connection_id: null };

describe('RelationshipStateSchema', () => {
  it.each(['none', 'outgoing_pending', 'incoming_pending', 'connected'])('accepts %s', (state) =>
    expect(() => RelationshipStateSchema.parse(state)).not.toThrow()
  );
  it('rejects an unknown state', () => {
    expect(() => RelationshipStateSchema.parse('blocked')).toThrow();
  });
});

describe('RelationshipSchema', () => {
  it('accepts a pending relationship with a request_id', () => {
    expect(() =>
      RelationshipSchema.parse({
        state: 'incoming_pending',
        request_id: 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb',
        connection_id: null,
      })
    ).not.toThrow();
  });
  it('accepts a connected relationship with a connection_id', () => {
    expect(() =>
      RelationshipSchema.parse({
        state: 'connected',
        request_id: null,
        connection_id: 'cccccccc-cccc-4ccc-cccc-cccccccccccc',
      })
    ).not.toThrow();
  });
  it('rejects a non-uuid request_id', () => {
    expect(() =>
      RelationshipSchema.parse({
        state: 'outgoing_pending',
        request_id: 'nope',
        connection_id: null,
      })
    ).toThrow();
  });
});

describe('BasicUserSchema', () => {
  it('accepts a basic user', () => {
    expect(() => BasicUserSchema.parse(basicUser)).not.toThrow();
  });
  it('rejects a missing username', () => {
    const { username: _omit, ...withoutUsername } = basicUser;
    expect(() => BasicUserSchema.parse(withoutUsername)).toThrow();
  });
  it('accepts null first/last name and avatar_color', () => {
    expect(() =>
      BasicUserSchema.parse({ ...basicUser, first_name: null, last_name: null, avatar_color: null })
    ).not.toThrow();
  });
});

describe('UserSearchResultSchema / UserProfileResponseSchema', () => {
  it('accepts a search result with username + relationship', () => {
    expect(() => UserSearchResultSchema.parse({ ...basicUser, relationship })).not.toThrow();
  });
  it('rejects a search result missing relationship', () => {
    expect(() => UserSearchResultSchema.parse(basicUser)).toThrow();
  });
  it('accepts a profile response', () => {
    expect(() => UserProfileResponseSchema.parse({ ...basicUser, relationship })).not.toThrow();
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail** — Run: `cd nebbler && npx jest src/database/schemas/__tests__/apiSchemas.test.ts`. Expected: FAIL (`RelationshipSchema`/`BasicUserSchema`/`UserProfileResponseSchema` are not exported).

- [ ] **Step 3: Implement the schemas** — edit `src/database/schemas/apiSchemas.ts`. Keep `FetchCredentialsResponseSchema` and `ApiErrorResponseSchema` unchanged. Replace the `UserSearchResultSchema` block with:

```typescript
/**
 * Relationship state between the current user and another user (the FE's core
 * mental model). Carried on every payload that returns another user.
 * Contract: connections-api-contract-be-fe.
 */
export const RelationshipStateSchema = z.enum([
  'none',
  'outgoing_pending',
  'incoming_pending',
  'connected',
]);

export type RelationshipState = z.infer<typeof RelationshipStateSchema>;

export const RelationshipSchema = z.object({
  state: RelationshipStateSchema,
  // present for *_pending (accept/decline/cancel); null otherwise
  request_id: z.string().uuid().nullable(),
  // present for connected (open profile); null otherwise. NOT a stable id —
  // re-connecting after a removal yields a new id (contract "Deletion model").
  connection_id: z.string().uuid().nullable(),
});

export type Relationship = z.infer<typeof RelationshipSchema>;

/**
 * Basic (public) user identity. Returned everywhere a user appears.
 * Email is NEVER part of this shape.
 */
export const BasicUserSchema = z.object({
  id: z.string().uuid(),
  username: z.string(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  avatar_color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .nullable(),
});

export type BasicUser = z.infer<typeof BasicUserSchema>;

/**
 * A single user result from GET /api/users/search — basic info + relationship.
 */
export const UserSearchResultSchema = BasicUserSchema.extend({
  relationship: RelationshipSchema,
});

export const UserSearchResponseSchema = z.array(UserSearchResultSchema);

export type UserSearchResult = z.infer<typeof UserSearchResultSchema>;

/**
 * GET /api/users/:id — basic info + relationship (same shape as a search result).
 */
export const UserProfileResponseSchema = BasicUserSchema.extend({
  relationship: RelationshipSchema,
});

export type UserProfileResponse = z.infer<typeof UserProfileResponseSchema>;
```

- [ ] **Step 4: Re-export from the barrel** — in `src/database/schemas/index.ts`, extend the `./apiSchemas` export to include the new names:

```typescript
export {
  FetchCredentialsResponseSchema,
  type FetchCredentialsResponse,
  ApiErrorResponseSchema,
  type ApiErrorResponse,
  RelationshipStateSchema,
  type RelationshipState,
  RelationshipSchema,
  type Relationship,
  BasicUserSchema,
  type BasicUser,
  UserSearchResultSchema,
  UserSearchResponseSchema,
  type UserSearchResult,
  UserProfileResponseSchema,
  type UserProfileResponse,
} from './apiSchemas';
```

- [ ] **Step 5: Fix the existing userSearch test mocks** — in `src/utils/__tests__/userSearch.test.ts`, the success-path `mockUser` now fails `UserSearchResponseSchema.parse` because `username` + `relationship` are required. Update it:

```typescript
const mockUser = {
  id: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
  username: 'alice',
  first_name: 'Alice',
  last_name: 'Smith',
  avatar_color: '#00DB74',
  relationship: { state: 'none', request_id: null, connection_id: null },
};
```

- [ ] **Step 6: Run tests + typecheck to confirm green** — Run: `cd nebbler && npx jest src/database/schemas/__tests__/apiSchemas.test.ts src/utils/__tests__/userSearch.test.ts && npx tsc --noEmit`. Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add nebbler/src/database/schemas/apiSchemas.ts nebbler/src/database/schemas/index.ts \
  nebbler/src/database/schemas/__tests__/apiSchemas.test.ts nebbler/src/utils/__tests__/userSearch.test.ts
git commit -m "feat(connections): add relationship + basic-user schemas; extend search/profile (NEB-150)"
```

---

### Task 2: Connection-request list/item schemas

**Goal:** Add the Zod schemas for `GET /api/connection-requests` (incoming/outgoing split) and the `POST` created-request body, reusing `BasicUserSchema`.

**Files:**

- Create: `src/database/schemas/connectionRequestSchemas.ts`
- Modify: `src/database/schemas/index.ts`
- Test: `src/database/schemas/__tests__/connectionRequestSchemas.test.ts` (create)

**Acceptance Criteria:**

- [ ] `ConnectionRequestItemSchema` = `{ id: uuid, user: BasicUser, requested_at: string }`.
- [ ] `ConnectionRequestListResponseSchema` = `{ incoming: Item[], outgoing: Item[] }`.
- [ ] `ConnectionRequestSchema` (created-request, tolerant) = `{ id: uuid, requested_at: string }`.
- [ ] All re-exported from `index.ts`; `src/database/schemas/**` coverage ≥90%.

**Verify:** `cd nebbler && npx jest src/database/schemas/__tests__/connectionRequestSchemas.test.ts && npx tsc --noEmit` → pass.

**Steps:**

- [ ] **Step 1: Write failing tests** — `src/database/schemas/__tests__/connectionRequestSchemas.test.ts`

```typescript
import {
  ConnectionRequestSchema,
  ConnectionRequestItemSchema,
  ConnectionRequestListResponseSchema,
} from '@database/schemas';

const user = {
  id: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
  username: 'alice',
  first_name: 'Alice',
  last_name: 'Smith',
  avatar_color: '#00DB74',
};
const item = {
  id: 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb',
  user,
  requested_at: '2026-06-09T00:00:00Z',
};

describe('ConnectionRequestItemSchema', () => {
  it('accepts a valid item', () => {
    expect(() => ConnectionRequestItemSchema.parse(item)).not.toThrow();
  });
  it('rejects an item whose user lacks username', () => {
    const { username: _omit, ...badUser } = user;
    expect(() => ConnectionRequestItemSchema.parse({ ...item, user: badUser })).toThrow();
  });
  it('rejects a non-uuid id', () => {
    expect(() => ConnectionRequestItemSchema.parse({ ...item, id: 'nope' })).toThrow();
  });
});

describe('ConnectionRequestListResponseSchema', () => {
  it('accepts incoming + outgoing arrays', () => {
    expect(() =>
      ConnectionRequestListResponseSchema.parse({ incoming: [item], outgoing: [] })
    ).not.toThrow();
  });
  it('rejects when a direction key is missing', () => {
    expect(() => ConnectionRequestListResponseSchema.parse({ incoming: [item] })).toThrow();
  });
});

describe('ConnectionRequestSchema (created request)', () => {
  it('accepts a created request and strips extra keys', () => {
    const parsed = ConnectionRequestSchema.parse({
      id: 'cccccccc-cccc-4ccc-cccc-cccccccccccc',
      requested_at: '2026-06-09T00:00:00Z',
      extra: 'ignored',
    });
    expect(parsed).not.toHaveProperty('extra');
  });
  it('rejects a missing id', () => {
    expect(() => ConnectionRequestSchema.parse({ requested_at: '2026-06-09T00:00:00Z' })).toThrow();
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail** — Run: `cd nebbler && npx jest src/database/schemas/__tests__/connectionRequestSchemas.test.ts`. Expected: FAIL (module not found).

- [ ] **Step 3: Implement** — `src/database/schemas/connectionRequestSchemas.ts`

```typescript
import { z } from 'zod';

import { BasicUserSchema } from './apiSchemas';

/**
 * The created request returned by POST /api/connection-requests (201).
 * Tolerant: extra keys are stripped, since the full body is not pinned by the
 * contract. Adjust if the backend (NEB-138) returns a richer/leaner shape.
 */
export const ConnectionRequestSchema = z.object({
  id: z.string().uuid(),
  requested_at: z.string(),
});

export type ConnectionRequest = z.infer<typeof ConnectionRequestSchema>;

/**
 * One item in either direction of GET /api/connection-requests. `user` is the
 * *other* party (requestor for incoming, requestee for outgoing).
 */
export const ConnectionRequestItemSchema = z.object({
  id: z.string().uuid(),
  user: BasicUserSchema,
  requested_at: z.string(),
});

export type ConnectionRequestItem = z.infer<typeof ConnectionRequestItemSchema>;

/**
 * GET /api/connection-requests — pending requests, pre-split by direction.
 */
export const ConnectionRequestListResponseSchema = z.object({
  incoming: z.array(ConnectionRequestItemSchema),
  outgoing: z.array(ConnectionRequestItemSchema),
});

export type ConnectionRequestListResponse = z.infer<typeof ConnectionRequestListResponseSchema>;
```

- [ ] **Step 4: Re-export from the barrel** — append to `src/database/schemas/index.ts`:

```typescript
export {
  ConnectionRequestSchema,
  type ConnectionRequest,
  ConnectionRequestItemSchema,
  type ConnectionRequestItem,
  ConnectionRequestListResponseSchema,
  type ConnectionRequestListResponse,
} from './connectionRequestSchemas';
```

- [ ] **Step 5: Run tests + typecheck** — Run: `cd nebbler && npx jest src/database/schemas/__tests__/connectionRequestSchemas.test.ts && npx tsc --noEmit`. Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add nebbler/src/database/schemas/connectionRequestSchemas.ts nebbler/src/database/schemas/index.ts \
  nebbler/src/database/schemas/__tests__/connectionRequestSchemas.test.ts
git commit -m "feat(connections): add connection-request list/item/created schemas (NEB-150)"
```

---

### Task 3: Relationship helper (`relationship.ts`)

**Goal:** A UI-agnostic helper mapping a `Relationship` to a concrete action descriptor, plus `otherParticipant` to resolve the non-self side of a synced `user_connections` row.

**Files:**

- Create: `src/utils/relationship.ts`
- Test: `src/utils/__tests__/relationship.test.ts` (create)

**Acceptance Criteria:**

- [ ] `RelationshipAction` is a discriminated union: `connect` | `cancel{requestId}` | `respond{requestId}` | `open{connectionId}`.
- [ ] `relationshipToAction` maps all four states correctly and throws on an inconsistent payload (e.g. `outgoing_pending` with null `request_id`).
- [ ] `otherParticipant` returns the other id regardless of which side `myId` is on.
- [ ] No `fetch`/React imports (stays within `util` boundary); coverage ≥90% lines/functions, ≥65% branches.

**Verify:** `cd nebbler && npx jest src/utils/__tests__/relationship.test.ts && npx tsc --noEmit` → pass.

**Steps:**

- [ ] **Step 1: Write failing tests** — `src/utils/__tests__/relationship.test.ts`

```typescript
import { relationshipToAction, otherParticipant } from '@utils/relationship';
import type { Relationship } from '@database/schemas';

const reqId = 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb';
const connId = 'cccccccc-cccc-4ccc-cccc-cccccccccccc';

describe('relationshipToAction', () => {
  it('maps none → connect', () => {
    const rel: Relationship = { state: 'none', request_id: null, connection_id: null };
    expect(relationshipToAction(rel)).toEqual({ kind: 'connect' });
  });
  it('maps outgoing_pending → cancel with requestId', () => {
    const rel: Relationship = { state: 'outgoing_pending', request_id: reqId, connection_id: null };
    expect(relationshipToAction(rel)).toEqual({ kind: 'cancel', requestId: reqId });
  });
  it('maps incoming_pending → respond with requestId', () => {
    const rel: Relationship = { state: 'incoming_pending', request_id: reqId, connection_id: null };
    expect(relationshipToAction(rel)).toEqual({ kind: 'respond', requestId: reqId });
  });
  it('maps connected → open with connectionId', () => {
    const rel: Relationship = { state: 'connected', request_id: null, connection_id: connId };
    expect(relationshipToAction(rel)).toEqual({ kind: 'open', connectionId: connId });
  });
  it('throws when a pending state has no request_id', () => {
    const rel: Relationship = { state: 'outgoing_pending', request_id: null, connection_id: null };
    expect(() => relationshipToAction(rel)).toThrow();
  });
  it('throws when connected has no connection_id', () => {
    const rel: Relationship = { state: 'connected', request_id: null, connection_id: null };
    expect(() => relationshipToAction(rel)).toThrow();
  });
});

describe('otherParticipant', () => {
  const me = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
  const them = 'dddddddd-dddd-4ddd-dddd-dddddddddddd';
  it('returns user_b when I am user_a', () => {
    expect(otherParticipant({ user_a_id: me, user_b_id: them }, me)).toBe(them);
  });
  it('returns user_a when I am user_b', () => {
    expect(otherParticipant({ user_a_id: them, user_b_id: me }, me)).toBe(them);
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail** — Run: `cd nebbler && npx jest src/utils/__tests__/relationship.test.ts`. Expected: FAIL (module not found).

- [ ] **Step 3: Implement** — `src/utils/relationship.ts`

```typescript
import type { Relationship } from '@database/schemas';

/**
 * UI-agnostic action derived from a relationship. The component layer (FE-4..6)
 * maps each `kind` to its button(s):
 *   connect → "Connect" | cancel → "Pending" (tap to cancel)
 *   respond → "Accept" / "Decline" | open → "Connected" (open profile)
 */
export type RelationshipAction =
  | { kind: 'connect' }
  | { kind: 'cancel'; requestId: string }
  | { kind: 'respond'; requestId: string }
  | { kind: 'open'; connectionId: string };

/**
 * Map a relationship to its action. Throws on an internally-inconsistent
 * payload (a pending state without `request_id`, or `connected` without
 * `connection_id`) — that is a backend contract violation, not a UI state.
 */
export function relationshipToAction(relationship: Relationship): RelationshipAction {
  const { state, request_id, connection_id } = relationship;
  switch (state) {
    case 'none':
      return { kind: 'connect' };
    case 'outgoing_pending':
      if (!request_id) throw new Error('outgoing_pending relationship is missing request_id');
      return { kind: 'cancel', requestId: request_id };
    case 'incoming_pending':
      if (!request_id) throw new Error('incoming_pending relationship is missing request_id');
      return { kind: 'respond', requestId: request_id };
    case 'connected':
      if (!connection_id) throw new Error('connected relationship is missing connection_id');
      return { kind: 'open', connectionId: connection_id };
  }
}

/**
 * Resolve the other participant of a synced `user_connections` row. Direction is
 * not meaningful once connected, so callers must not assume `user_a` is "me".
 */
export function otherParticipant(
  row: { user_a_id: string; user_b_id: string },
  myId: string
): string {
  return row.user_a_id === myId ? row.user_b_id : row.user_a_id;
}
```

- [ ] **Step 4: Run tests + typecheck** — Run: `cd nebbler && npx jest src/utils/__tests__/relationship.test.ts && npx tsc --noEmit`. Expected: PASS. (The `switch` is exhaustive over `RelationshipState`, so no `default` is needed and `tsc` confirms exhaustiveness.)

- [ ] **Step 5: Commit**

```bash
git add nebbler/src/utils/relationship.ts nebbler/src/utils/__tests__/relationship.test.ts
git commit -m "feat(connections): add relationship action + otherParticipant helper (NEB-150)"
```

---

### Task 4: `src/api/connections.ts` — REST client (typed errors + all 5 calls) + boundary edit

**Goal:** Create the online REST client in the sanctioned `src/api/**` layer: typed error classes, the shared auth+fetch+error-mapping core, and all five calls (`sendRequest`, `listRequests`, `resolveRequest`, `removeConnection`, `getUserProfile`). Add the `api → data` boundary edge so the layer can import schemas + `getApiToken`. **No `no-restricted-syntax` exemption** (`fetch` is already sanctioned in `src/api/**`).

**Files:**

- Create: `src/api/connections.ts`
- Modify: `eslint.config.js` (add `data` to the `api` boundary allow-list)
- Test: `src/api/__tests__/connections.test.ts` (create)

**Acceptance Criteria:**

- [ ] Typed errors extend a common `ConnectionsApiError`: `NotAuthenticatedError` (401/no token), `InboundRequestExistsError` (**distinct**, 409 `inbound_request_exists`), `AlreadyConnectedError` (409), `DuplicateRequestError` (409), `ValidationError` (422, carries `details`), `ForbiddenError` (403), `NotFoundError` (404).
- [ ] `sendRequest(requesteeId)` POSTs `{ requestee_id }`, returns parsed created request on 201, else throws the right typed error.
- [ ] `listRequests()` GETs + Zod-parses `{ incoming, outgoing }`.
- [ ] `resolveRequest(id, status)` PATCHes `{ status }` for `accepted|declined|cancelled`, resolves on 2xx.
- [ ] `removeConnection(connectionId)` DELETEs `/api/connections/:id`, resolves on 2xx, maps `403/404/401`.
- [ ] `getUserProfile(id)` GETs `/api/users/:id` and Zod-parses `UserProfileResponse`.
- [ ] No `blockUser` (NEB-139 pending). Every request carries `Authorization: Bearer <token>`; a missing token throws `NotAuthenticatedError` before any `fetch`.
- [ ] `eslint.config.js` `api` allow-list now includes `data`; `npm run lint` passes with **no new `no-restricted-syntax` exemption**.

**Verify:** `cd nebbler && npx jest src/api/__tests__/connections.test.ts && npm run lint && npx tsc --noEmit` → all pass.

**Steps:**

- [ ] **Step 1: Add the boundary edge first** (so lint passes once the file imports `data`). In `eslint.config.js`, find the `eslint-plugin-boundaries` rules and change the `api` allow-list:

```javascript
// before:
{ from: ['api'], allow: ['api', 'type', 'constant', 'util'] },
// after — api may read the data layer (Zod schemas + getApiToken), the same
// edge `util` already has (how src/utils/userSearch.ts reaches @database/*):
{ from: ['api'], allow: ['api', 'type', 'constant', 'util', 'data'] },
```

- [ ] **Step 2: Write failing tests** — `src/api/__tests__/connections.test.ts`

```typescript
import { getApiToken } from '@database/index';
import {
  sendRequest,
  listRequests,
  resolveRequest,
  removeConnection,
  getUserProfile,
  NotAuthenticatedError,
  InboundRequestExistsError,
  AlreadyConnectedError,
  DuplicateRequestError,
  ValidationError,
  ForbiddenError,
  NotFoundError,
} from '@api/connections';

jest.mock('@database/index', () => ({ getApiToken: jest.fn() }));
jest.mock('expo-constants', () => ({
  default: { expoConfig: { extra: { apiPort: '4000', powersyncPort: '8080' } } },
}));

const mockGetApiToken = getApiToken as jest.MockedFunction<typeof getApiToken>;
let fetchSpy: jest.SpyInstance;

const errorBody = (code: string, message = 'err', details?: unknown) => ({
  ok: false,
  json: jest.fn().mockResolvedValue({ error: { code, message, details } }),
});

beforeEach(() => {
  jest.clearAllMocks();
  mockGetApiToken.mockResolvedValue('test-token');
  fetchSpy = jest.spyOn(globalThis, 'fetch').mockImplementation(jest.fn());
});
afterEach(() => fetchSpy.mockRestore());

describe('auth', () => {
  it('throws NotAuthenticatedError and never fetches when no token', async () => {
    mockGetApiToken.mockResolvedValue(null);
    await expect(sendRequest('id')).rejects.toThrow(NotAuthenticatedError);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe('sendRequest', () => {
  it('POSTs requestee_id with bearer token and returns created request on 201', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      status: 201,
      json: jest.fn().mockResolvedValue({
        id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
        requested_at: '2026-06-09T00:00:00Z',
      }),
    });
    const res = await sendRequest('dddddddd-dddd-4ddd-8ddd-dddddddddddd');
    expect(res.id).toBe('cccccccc-cccc-4ccc-8ccc-cccccccccccc');
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/connection-requests'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ requestee_id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd' }),
        headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
      })
    );
  });

  it('throws InboundRequestExistsError on 409 inbound_request_exists', async () => {
    fetchSpy.mockResolvedValue({ status: 409, ...errorBody('inbound_request_exists') });
    await expect(sendRequest('id')).rejects.toThrow(InboundRequestExistsError);
  });
  it('throws AlreadyConnectedError on 409 already_connected', async () => {
    fetchSpy.mockResolvedValue({ status: 409, ...errorBody('already_connected') });
    await expect(sendRequest('id')).rejects.toThrow(AlreadyConnectedError);
  });
  it('throws DuplicateRequestError on 409 duplicate_request', async () => {
    fetchSpy.mockResolvedValue({ status: 409, ...errorBody('duplicate_request') });
    await expect(sendRequest('id')).rejects.toThrow(DuplicateRequestError);
  });
  it('throws ValidationError with details on 422', async () => {
    fetchSpy.mockResolvedValue({
      status: 422,
      ...errorBody('validation_failed', 'bad', { requestee_id: ['is invalid'] }),
    });
    await expect(sendRequest('id')).rejects.toMatchObject({
      name: 'ValidationError',
      details: { requestee_id: ['is invalid'] },
    });
  });
});

describe('listRequests', () => {
  it('GETs and parses incoming/outgoing', async () => {
    const user = {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      username: 'alice',
      first_name: 'Alice',
      last_name: 'Smith',
      avatar_color: '#00DB74',
    };
    fetchSpy.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        incoming: [
          {
            id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
            user,
            requested_at: '2026-06-09T00:00:00Z',
          },
        ],
        outgoing: [],
      }),
    });
    const res = await listRequests();
    expect(res.incoming).toHaveLength(1);
    expect(res.outgoing).toHaveLength(0);
  });
  it('throws NotFoundError on 404', async () => {
    fetchSpy.mockResolvedValue({ status: 404, ...errorBody('not_found') });
    await expect(listRequests()).rejects.toThrow(NotFoundError);
  });
});

describe('resolveRequest', () => {
  it.each(['accepted', 'declined', 'cancelled'] as const)('PATCHes status=%s', async (status) => {
    fetchSpy.mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue({}) });
    await expect(resolveRequest('req-id', status)).resolves.toBeUndefined();
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/connection-requests/req-id'),
      expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ status }) })
    );
  });
  it('throws ForbiddenError on 403 (wrong actor)', async () => {
    fetchSpy.mockResolvedValue({ status: 403, ...errorBody('forbidden') });
    await expect(resolveRequest('req-id', 'accepted')).rejects.toThrow(ForbiddenError);
  });
});

describe('removeConnection', () => {
  it('DELETEs /api/connections/:id with bearer token', async () => {
    fetchSpy.mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue({}) });
    await expect(removeConnection('conn-id')).resolves.toBeUndefined();
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/connections/conn-id'),
      expect.objectContaining({
        method: 'DELETE',
        headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
      })
    );
  });
  it('throws ForbiddenError on 403 (non-participant)', async () => {
    fetchSpy.mockResolvedValue({ status: 403, ...errorBody('forbidden') });
    await expect(removeConnection('conn-id')).rejects.toThrow(ForbiddenError);
  });
  it('throws NotFoundError on 404', async () => {
    fetchSpy.mockResolvedValue({ status: 404, ...errorBody('not_found') });
    await expect(removeConnection('conn-id')).rejects.toThrow(NotFoundError);
  });
  it('throws NotAuthenticatedError when no token', async () => {
    mockGetApiToken.mockResolvedValue(null);
    await expect(removeConnection('conn-id')).rejects.toThrow(NotAuthenticatedError);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe('getUserProfile', () => {
  const profile = {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    username: 'alice',
    first_name: 'Alice',
    last_name: 'Smith',
    avatar_color: '#00DB74',
    relationship: {
      state: 'connected',
      request_id: null,
      connection_id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    },
  };
  it('GETs /api/users/:id and parses the profile', async () => {
    fetchSpy.mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue(profile) });
    const res = await getUserProfile(profile.id);
    expect(res.username).toBe('alice');
    expect(res.relationship.state).toBe('connected');
  });
  it('throws NotFoundError on 404', async () => {
    fetchSpy.mockResolvedValue({ status: 404, ...errorBody('not_found') });
    await expect(getUserProfile('missing')).rejects.toThrow(NotFoundError);
  });
});
```

- [ ] **Step 3: Run tests to confirm they fail** — Run: `cd nebbler && npx jest src/api/__tests__/connections.test.ts`. Expected: FAIL (module not found).

- [ ] **Step 4: Implement** — `src/api/connections.ts`

```typescript
import { powersyncConfig } from '@constants/config';
import { getApiToken } from '@database/index';
import {
  ApiErrorResponseSchema,
  ConnectionRequestSchema,
  ConnectionRequestListResponseSchema,
  UserProfileResponseSchema,
  type ConnectionRequest,
  type ConnectionRequestListResponse,
  type UserProfileResponse,
} from '@database/schemas';

// ---------------------------------------------------------------------------
// Typed errors — mapped from the canonical NEB-147 envelope { error: { code, message, details? } }.
// ---------------------------------------------------------------------------

export class ConnectionsApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ConnectionsApiError';
    this.status = status;
    this.code = code;
  }
}

/** No auth token, or HTTP 401. */
export class NotAuthenticatedError extends ConnectionsApiError {
  constructor(message = 'User not signed in') {
    super(401, 'unauthenticated', message);
    this.name = 'NotAuthenticatedError';
  }
}

/** 403 — wrong actor for the transition, or non-participant on remove. */
export class ForbiddenError extends ConnectionsApiError {
  constructor(message = 'Forbidden') {
    super(403, 'forbidden', message);
    this.name = 'ForbiddenError';
  }
}

/** 404 — request/connection/user not found. */
export class NotFoundError extends ConnectionsApiError {
  constructor(message = 'Not found') {
    super(404, 'not_found', message);
    this.name = 'NotFoundError';
  }
}

/** 422 — self-connection or invalid/missing requestee. Carries field details. */
export class ValidationError extends ConnectionsApiError {
  details?: Record<string, string[]>;
  constructor(message = 'Validation failed', details?: Record<string, string[]>) {
    super(422, 'validation_failed', message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

/**
 * 409 inbound_request_exists — the other user already sent YOU a pending
 * request. DISTINCT type: drives the FE-5 "Accept instead" handoff.
 */
export class InboundRequestExistsError extends ConnectionsApiError {
  constructor(message = 'This user has already sent you a request') {
    super(409, 'inbound_request_exists', message);
    this.name = 'InboundRequestExistsError';
  }
}

/** 409 — an active connection already exists. */
export class AlreadyConnectedError extends ConnectionsApiError {
  constructor(message = 'You are already connected') {
    super(409, 'already_connected', message);
    this.name = 'AlreadyConnectedError';
  }
}

/** 409 — the current user already has an outstanding request to this user. */
export class DuplicateRequestError extends ConnectionsApiError {
  constructor(message = 'You already have a pending request to this user') {
    super(409, 'duplicate_request', message);
    this.name = 'DuplicateRequestError';
  }
}

// ---------------------------------------------------------------------------
// Shared core
// ---------------------------------------------------------------------------

async function authedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await getApiToken();
  if (!token) throw new NotAuthenticatedError();
  return fetch(`${powersyncConfig.backendUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
  });
}

/**
 * Map a non-2xx response to a typed error using the canonical envelope.
 * NOTE: the exact 409 `code` strings for already_connected / duplicate_request
 * are assumptions pending BE (NEB-138); inbound_request_exists is contractual.
 */
async function toTypedError(response: Response): Promise<ConnectionsApiError> {
  let code = '';
  let message = `Request failed with status ${response.status}`;
  let details: Record<string, string[]> | undefined;
  try {
    const parsed = ApiErrorResponseSchema.safeParse(await response.json());
    if (parsed.success) {
      code = parsed.data.error.code;
      message = parsed.data.error.message;
      details = parsed.data.error.details;
    }
  } catch {
    // non-JSON body — fall back to status-only mapping
  }

  switch (response.status) {
    case 401:
      return new NotAuthenticatedError(message);
    case 403:
      return new ForbiddenError(message);
    case 404:
      return new NotFoundError(message);
    case 422:
      return new ValidationError(message, details);
    case 409:
      if (code === 'inbound_request_exists') return new InboundRequestExistsError(message);
      if (code === 'already_connected') return new AlreadyConnectedError(message);
      if (code === 'duplicate_request') return new DuplicateRequestError(message);
      return new ConnectionsApiError(409, code || 'conflict', message);
    default:
      return new ConnectionsApiError(response.status, code || 'error', message);
  }
}

// ---------------------------------------------------------------------------
// connection-requests resource
// ---------------------------------------------------------------------------

/** POST /api/connection-requests — send a request. */
export async function sendRequest(requesteeId: string): Promise<ConnectionRequest> {
  const response = await authedFetch('/api/connection-requests', {
    method: 'POST',
    body: JSON.stringify({ requestee_id: requesteeId }),
  });
  if (response.status === 201) {
    return ConnectionRequestSchema.parse(await response.json());
  }
  throw await toTypedError(response);
}

/** GET /api/connection-requests — pending requests, split by direction. */
export async function listRequests(): Promise<ConnectionRequestListResponse> {
  const response = await authedFetch('/api/connection-requests', { method: 'GET' });
  if (response.ok) {
    return ConnectionRequestListResponseSchema.parse(await response.json());
  }
  throw await toTypedError(response);
}

export type ResolveStatus = 'accepted' | 'declined' | 'cancelled';

/** PATCH /api/connection-requests/:id — accept (requestee) / decline (requestee) / cancel (requestor). */
export async function resolveRequest(id: string, status: ResolveStatus): Promise<void> {
  const response = await authedFetch(`/api/connection-requests/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  if (response.ok) return;
  throw await toTypedError(response);
}

// ---------------------------------------------------------------------------
// connections + users resources
// ---------------------------------------------------------------------------

/**
 * DELETE /api/connections/:id — remove/unfriend. Either participant may remove.
 * Server soft-deletes + cascades shared-calendar revocation; the row de-syncs.
 * `:id` is the synced user_connections id (not stable across remove → re-add).
 */
export async function removeConnection(connectionId: string): Promise<void> {
  const response = await authedFetch(`/api/connections/${connectionId}`, { method: 'DELETE' });
  if (response.ok) return;
  throw await toTypedError(response);
}

/** GET /api/users/:id — basic info + relationship. Never includes email. */
export async function getUserProfile(id: string): Promise<UserProfileResponse> {
  const response = await authedFetch(`/api/users/${id}`, { method: 'GET' });
  if (response.ok) {
    return UserProfileResponseSchema.parse(await response.json());
  }
  throw await toTypedError(response);
}
```

- [ ] **Step 5: Run tests + lint + typecheck** — Run: `cd nebbler && npx jest src/api/__tests__/connections.test.ts && npm run lint && npx tsc --noEmit`. Expected: PASS. (If `npm run lint` reports an `api → data` boundary error, Step 1's allow-list edit was missed.)

- [ ] **Step 6: Commit**

```bash
git add nebbler/src/api/connections.ts nebbler/src/api/__tests__/connections.test.ts nebbler/eslint.config.js
git commit -m "feat(connections): REST client in src/api with typed errors + api→data boundary (NEB-150)"
```

---

### Task 5: TanStack Query hooks (`src/hooks/useConnectionsApi.ts`) + full gate

**Goal:** Expose the `src/api/connections.ts` functions as TanStack Query hooks (the repo-standard consumption layer for online REST), with a query-key factory and mutation cache invalidation. Then run the full `npm run check` gate.

**Files:**

- Create: `src/hooks/useConnectionsApi.ts`
- Create: `src/hooks/__tests__/useConnectionsApi.test.tsx`
- Modify: `src/hooks/index.ts` (only if it re-exports hooks — match the existing barrel; otherwise skip)

**Acceptance Criteria:**

- [ ] `connectionsKeys` query-key factory (`all`, `requests()`, `profile(id)`).
- [ ] `useConnectionRequests()` query wraps `listRequests`; `useUserProfile(id)` query wraps `getUserProfile`, `enabled` only when `id` is set.
- [ ] `useSendRequest()`, `useResolveRequest()`, `useRemoveConnection()` mutations wrap the api fns and invalidate the relevant queries on success (requests + profile for send/resolve; profile for remove).
- [ ] Uses TanStack v5 object syntax; imports `@tanstack/react-query` (allowed in `src/hooks/**`).
- [ ] Tests use `renderHook` with a `QueryClientProvider` wrapper and mock `@api/connections`; they assert the api fn is called with the right args, the query/mutation reaches success, and `invalidateQueries` is called.
- [ ] `npm run check` passes (full gate: lint + format:check + typecheck + test).

**Verify:** `cd nebbler && npm run check` → all green.

**Steps:**

- [ ] **Step 1: Write failing tests** — `src/hooks/__tests__/useConnectionsApi.test.tsx`

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import React, { type ReactNode } from 'react';

import * as connectionsApi from '@api/connections';
import {
  connectionsKeys,
  useConnectionRequests,
  useUserProfile,
  useSendRequest,
  useResolveRequest,
  useRemoveConnection,
} from '@hooks/useConnectionsApi';

jest.mock('@api/connections');

const mockedApi = connectionsApi as jest.Mocked<typeof connectionsApi>;

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, Wrapper };
}

beforeEach(() => jest.clearAllMocks());

describe('useConnectionRequests', () => {
  it('queries listRequests and exposes the data', async () => {
    mockedApi.listRequests.mockResolvedValue({ incoming: [], outgoing: [] });
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useConnectionRequests(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.listRequests).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual({ incoming: [], outgoing: [] });
  });
});

describe('useUserProfile', () => {
  it('does not fetch when id is undefined', () => {
    const { Wrapper } = createWrapper();
    renderHook(() => useUserProfile(undefined), { wrapper: Wrapper });
    expect(mockedApi.getUserProfile).not.toHaveBeenCalled();
  });
  it('fetches the profile when id is set', async () => {
    mockedApi.getUserProfile.mockResolvedValue({
      id: 'u1',
      username: 'alice',
      first_name: 'Alice',
      last_name: 'Smith',
      avatar_color: '#00DB74',
      relationship: { state: 'none', request_id: null, connection_id: null },
    });
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useUserProfile('u1'), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.getUserProfile).toHaveBeenCalledWith('u1');
  });
});

describe('useSendRequest', () => {
  it('calls sendRequest and invalidates the requests query on success', async () => {
    mockedApi.sendRequest.mockResolvedValue({ id: 'r1', requested_at: '2026-06-09T00:00:00Z' });
    const { queryClient, Wrapper } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useSendRequest(), { wrapper: Wrapper });
    await result.current.mutateAsync('user-id');
    expect(mockedApi.sendRequest).toHaveBeenCalledWith('user-id');
    await waitFor(() =>
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: connectionsKeys.requests() })
    );
  });
});

describe('useResolveRequest', () => {
  it('calls resolveRequest with id + status', async () => {
    mockedApi.resolveRequest.mockResolvedValue(undefined);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useResolveRequest(), { wrapper: Wrapper });
    await result.current.mutateAsync({ id: 'req-1', status: 'accepted' });
    expect(mockedApi.resolveRequest).toHaveBeenCalledWith('req-1', 'accepted');
  });
});

describe('useRemoveConnection', () => {
  it('calls removeConnection with the connection id', async () => {
    mockedApi.removeConnection.mockResolvedValue(undefined);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useRemoveConnection(), { wrapper: Wrapper });
    await result.current.mutateAsync('conn-1');
    expect(mockedApi.removeConnection).toHaveBeenCalledWith('conn-1');
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail** — Run: `cd nebbler && npx jest src/hooks/__tests__/useConnectionsApi.test.tsx`. Expected: FAIL (hook module not found).

- [ ] **Step 3: Implement** — `src/hooks/useConnectionsApi.ts`

```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  getUserProfile,
  listRequests,
  removeConnection,
  resolveRequest,
  sendRequest,
  type ResolveStatus,
} from '@api/connections';

/** Query-key factory for the online connections data. */
export const connectionsKeys = {
  all: ['connections'] as const,
  requests: () => [...connectionsKeys.all, 'requests'] as const,
  profile: (id: string) => [...connectionsKeys.all, 'profile', id] as const,
};

/** GET /api/connection-requests — pending incoming/outgoing. */
export function useConnectionRequests() {
  return useQuery({
    queryKey: connectionsKeys.requests(),
    queryFn: listRequests,
  });
}

/** GET /api/users/:id — only fetches when an id is provided. */
export function useUserProfile(id: string | undefined) {
  return useQuery({
    queryKey: connectionsKeys.profile(id ?? ''),
    queryFn: () => getUserProfile(id as string),
    enabled: !!id,
  });
}

/** Invalidate every cached user-profile query (relationship state may have changed). */
function invalidateProfiles(queryClient: ReturnType<typeof useQueryClient>): void {
  void queryClient.invalidateQueries({ queryKey: [...connectionsKeys.all, 'profile'] });
}

/** POST /api/connection-requests. */
export function useSendRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requesteeId: string) => sendRequest(requesteeId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: connectionsKeys.requests() });
      invalidateProfiles(queryClient);
    },
  });
}

/** PATCH /api/connection-requests/:id. */
export function useResolveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ResolveStatus }) =>
      resolveRequest(id, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: connectionsKeys.requests() });
      invalidateProfiles(queryClient);
    },
  });
}

/** DELETE /api/connections/:id. The synced list updates via PowerSync; refresh profiles. */
export function useRemoveConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (connectionId: string) => removeConnection(connectionId),
    onSuccess: () => invalidateProfiles(queryClient),
  });
}
```

- [ ] **Step 4: Re-export (only if `src/hooks/index.ts` is a hook barrel)** — read it first. If it re-exports hooks, add the new hooks following the existing style; if it does not list hooks (or doesn't exist), skip this step. Do not invent a barrel.

- [ ] **Step 5: Run the full gate** — Run: `cd nebbler && npm run check`. Expected: lint + format:check + typecheck + test all PASS. If `format:check` fails, run `npm run format` and re-check. Confirm the `src/hooks/**` thresholds still hold in the jest output.

- [ ] **Step 6: Commit**

```bash
git add nebbler/src/hooks/useConnectionsApi.ts nebbler/src/hooks/__tests__/useConnectionsApi.test.tsx
# include src/hooks/index.ts only if you modified it
git commit -m "feat(connections): TanStack Query hooks for connections REST; npm run check green (NEB-150)"
```

---

## Self-review (updated after the src/api + TanStack correction)

- **Spec coverage:** send/list/resolve/remove/profile REST client → Task 4 ✓. Typed errors incl. distinct `inbound_request_exists` → Task 4 ✓. Zod request-list + profile schemas → Tasks 1–2 (done) ✓. Extended `UserSearchResultSchema` (username + relationship) → Task 1 (done) ✓. Relationship helper (`relationshipToAction` all states + `otherParticipant` both directions) → Task 3 ✓. TanStack consumption hooks → Task 5 ✓. `npm run check` gate → Task 5 ✓. No `blockUser` (NEB-139 pending) → excluded ✓.
- **Architecture-standard compliance:** REST client lives in `src/api/**` (sanctioned `fetch` home) — **no new lint exemption**; exposed via TanStack hooks in `src/hooks/**`; the one boundary change is the justified `api → data` edge (Task 4). This replaces the original (wrong) `src/utils/connectionsApi.ts` + `no-restricted-syntax: off` approach.
- **Type consistency:** `Relationship`/`RelationshipState`/`BasicUser` (Task 1) consumed unchanged downstream. `ResolveStatus` (`accepted|declined|cancelled`) defined in `src/api/connections.ts` and reused by `useResolveRequest`. `connectionsKeys` is the single source of query keys (used by both hooks and tests).
- **Out-of-scope but in-blast-radius:** Task 1 fixed `userSearch.test.ts` mocks (done). Task 4 edits the eslint boundary allow-list (called out explicitly). Establishing the first TanStack test wrapper (`QueryClientProvider`) is new infra introduced in Task 5.

---

## Notes on blockers (not a code concern)

NEB-150 is `blockedBy` BE issues NEB-138/140/141/142/143 and FE-1 (done). This plan is **mock-driven** — every test stubs `fetch`/`getApiToken`, so implementation and `npm run check` do not require a live backend. The only thing the blockers gate is real-backend integration verification and confirmation of the two assumed 409 `code` strings (see drift flags). Implementation can proceed now; surface the drift flags to BE before declaring the epic integration-complete.
