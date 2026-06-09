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
