---
paths:
  - 'src/stores/**'
  - 'src/context/**'
---

## Context vs. Zustand

**Use Context when:**

- State changes infrequently (auth status, theme, locale, feature flags)
- The number of consumers is small or they all need the full value anyway
- You're providing a dependency (like a PowerSync instance or navigation ref) rather than frequently-changing state
- `AuthContext` is the canonical example — it changes on login/logout, not 60 times a second

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
| `AuthContext`      | `src/context/AuthContext.tsx`    | Auth user, token, isAuthenticated — gates navigation                                |
| `useScheduleStore` | `src/stores/useScheduleStore.ts` | Schedule screen date state, view state, sync coordination, card display preferences |

## Deep-Dive References

| Topic            | File                             | When to Read                           |
| ---------------- | -------------------------------- | -------------------------------------- |
| Zustand patterns | `.claude/rules/state/zustand.md` | Creating or modifying Zustand stores   |
| Auth context     | `.claude/rules/auth.md`          | Working with AuthContext, login/logout |
