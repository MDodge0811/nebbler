---
paths:
  - 'src/stores/**'
---

## Context vs. Zustand

**Use Context when:**

- State changes infrequently (theme, locale, feature flags)
- The number of consumers is small or they all need the full value anyway
- You're providing a dependency (like the PowerSync instance via `PowerSyncContext`) rather than frequently-changing state
- A third-party SDK owns the state and exposes a provider — e.g. `<ClerkProvider>` from `@clerk/clerk-expo`. The app no longer rolls its own `AuthContext`; sign-in state comes from `useAuth()` (a thin adapter over Clerk's hook).

**Use Zustand when:**

- State updates are high-frequency (scroll positions, drag gestures, animation values)
- Many consumers each only care about a slice of the state
- You need to read/write state outside the React tree (gesture callbacks, event handlers, utility functions)
- You want persistence with minimal boilerplate
- You'd otherwise be splitting into 3+ contexts just to avoid re-render cascades

**Keep using `useState` when:** State is scoped to one component (form inputs, local toggles) with no sharing needed.

## Existing State

| Store/Context      | File                             | Purpose                                                                             |
| ------------------ | -------------------------------- | ----------------------------------------------------------------------------------- |
| `ClerkProvider`    | (from `@clerk/clerk-expo`)       | Auth/session state. Consumed via `useAuth()` adapter in `src/hooks/useAuth.ts`.     |
| `PowerSyncContext` | (from `@powersync/react`)        | The PowerSync database singleton. Mounted in `App.tsx` after `initializeDatabase`.  |
| `useScheduleStore` | `src/stores/useScheduleStore.ts` | Schedule screen date state, view state, sync coordination, card display preferences |

## Deep-Dive References

| Topic            | File                             | When to Read                                                 |
| ---------------- | -------------------------------- | ------------------------------------------------------------ |
| Zustand patterns | `.claude/rules/state/zustand.md` | Creating or modifying Zustand stores                         |
| Auth integration | `.claude/rules/auth.md`          | Working with Clerk flows, `useAuth`, `useSignIn`/`useSignUp` |
