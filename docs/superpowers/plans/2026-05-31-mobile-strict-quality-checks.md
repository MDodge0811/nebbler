# Mobile Strict Type-Safety & Quality Checks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:subagent-driven-development (recommended) or superpowers-extended-cc:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tighten the `nebbler/` mobile app's compile- and lint-time guarantees in three tiers — stricter TypeScript compiler flags, type-aware ESLint, and rule promotions + tooling gaps — so type safety and code quality are enforced by CI rather than convention.

**Architecture:** Each tier is landed as a sequence of self-contained, committable tasks. Tier 1 tightens `tsconfig.json` one flag-group at a time, fixing the exact errors each surfaces (measured: 3 + 46 + 14 errors). Tier 2 converts `eslint.config.js` to a type-aware flat config and enables the async-safety and type-safety rule sets. Tier 3 promotes existing `warn` rules to `error`, adds import-cycle detection, and closes CI gaps (Knip, ts-reset). Every task's gate is "the relevant command reports zero errors."

**Tech Stack:** TypeScript 5.9, ESLint 9 (flat config), `typescript-eslint` v8, `eslint-plugin-import-x`, Knip, `@total-typescript/ts-reset`, GitHub Actions.

**Scope:** `nebbler/` mobile app only. The Elixir `nebbler-api/` is explicitly out of scope.

**Measured baseline (origin/main, this worktree):**

| Change                                             | New `tsc` errors | Where                                        |
| -------------------------------------------------- | ---------------- | -------------------------------------------- |
| Current `strict: true`                             | 0                | clean                                        |
| + low-noise flags (returns/switch/override/unused) | 3                | 2 source, 1 generated                        |
| + `noUncheckedIndexedAccess`                       | 46               | 38 in tests, 8 in source                     |
| + `exactOptionalPropertyTypes`                     | 14               | component prop + PowerSync update boundaries |

---

## File Structure

| File                                | Responsibility                             | Tasks         |
| ----------------------------------- | ------------------------------------------ | ------------- |
| `tsconfig.json`                     | Compiler strictness flags                  | 1, 2, 3       |
| `eslint.config.js`                  | Lint rule sets (type-aware)                | 4, 5, 6, 7, 8 |
| `package.json`                      | Dev deps + scripts (`check`, `lint:types`) | 4, 6, 8, 9    |
| `.github/workflows/ci.yml`          | CI gate wiring (Knip step)                 | 9             |
| `knip.config.ts`                    | Ignore new config/deps                     | 8, 9          |
| `src/types/ts-reset.d.ts`           | ts-reset global import                     | 9             |
| Various `src/**` + 1 generated file | Error fixes per flag/rule                  | all           |

---

## Task 1: Tier 1a — Low-noise TypeScript strict flags

**Goal:** Enable `noImplicitReturns`, `noFallthroughCasesInSwitch`, `noImplicitOverride`, `noUnusedLocals`, and `noUnusedParameters` and fix the 3 errors they surface.

**Files:**

- Modify: `tsconfig.json` (compilerOptions block, lines 4-12)
- Modify: `src/components/SyncStatusIndicator.tsx` (useEffect at line 61)
- Modify: `src/screens/EventDetailScreen.tsx` (useEffect at line 113)
- Modify: `components/ui/form-control/index.tsx` (dead `tva` const at lines 72-81)

**Acceptance Criteria:**

- [ ] The 5 flags are present in `tsconfig.json`.
- [ ] `npm run typecheck` reports 0 errors.
- [ ] No behavior change — the two `useEffect` fixes only add an explicit `return undefined`.

**Verify:** `npm run typecheck` → no `error TS` lines.

**Steps:**

- [ ] **Step 1: Add the flags to `tsconfig.json`.** Insert after the `"strict": true,` line:

```jsonc
    "strict": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitOverride": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
```

- [ ] **Step 2: Run typecheck to see the 3 failures.**

Run: `npm run typecheck`
Expected: 3 errors —

```
components/ui/form-control/index.tsx(72,7): error TS6133: 'formControlLabelAstrickStyle' is declared but its value is never read.
src/components/SyncStatusIndicator.tsx(61,13): error TS7030: Not all code paths return a value.
src/screens/EventDetailScreen.tsx(113,13): error TS7030: Not all code paths return a value.
```

- [ ] **Step 3: Fix `SyncStatusIndicator.tsx`.** The effect returns a cleanup only inside the `if (syncStatus.state === 'syncing' || ...)` branch. Add an explicit `return undefined;` as the last statement of the effect callback (after the closing `}` of the `if` block, before the effect callback's closing `}`):

```typescript
      animation.start();
      return () => {
        animation.stop();
      };
    }
    return undefined;
  }, [syncStatus.state, pulseAnim]);
```

(Keep the existing cleanup-return inside the `if`; only add the trailing `return undefined;`. Preserve the existing dependency array exactly.)

- [ ] **Step 4: Fix `EventDetailScreen.tsx`.** Same pattern — the effect returns a cleanup only inside `if (event === null && !isEditing)`. Add a trailing `return undefined;`:

```typescript
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [event, isEditing, navigation]);
```

- [ ] **Step 5: Fix the generated `form-control/index.tsx`.** Delete the unused `formControlLabelAstrickStyle` declaration (lines 72-81 — the entire `const formControlLabelAstrickStyle = tva({ ... });` block). It is never referenced. NOTE: this is a Gluestack-generated file; if the component is ever re-scaffolded via `npx gluestack-ui add form-control`, this dead declaration may reappear and need re-deleting.

- [ ] **Step 6: Verify and run full check.**

Run: `npm run typecheck && npm run lint`
Expected: 0 errors.

- [ ] **Step 7: Commit.**

```bash
git add tsconfig.json src/components/SyncStatusIndicator.tsx src/screens/EventDetailScreen.tsx components/ui/form-control/index.tsx
git commit -m "chore: enable low-noise strict tsconfig flags"
```

---

## Task 2: Tier 1b — `noUncheckedIndexedAccess`

**Goal:** Enable `noUncheckedIndexedAccess` (index/array access yields `T | undefined`) and fix the 46 errors — 8 in source, 38 in tests.

**Files:**

- Modify: `tsconfig.json`
- Modify (source, 8 errors): `src/utils/calendarColor.ts` (2), `src/utils/monthUtils.ts` (1), `src/utils/avatarColor.ts` (1), `src/screens/CreateEventScreen.tsx` (1), `src/screens/CreateCalendarScreen.tsx` (1), `src/hooks/useCalendarsListData.ts` (1), `src/components/schedule/CustomTabBar.tsx` (1)
- Modify (tests, 38 errors): `src/hooks/__tests__/useScheduleFeed.test.ts` (19), `src/utils/__tests__/monthUtils.test.ts` (7), `src/components/schedule/week-strip/__tests__/useWeekPages.test.ts` (5), `src/components/schedule/month-grid/__tests__/useMonthPages.test.ts` (4), `src/stores/__tests__/useDragStore.test.ts` (2), `src/hooks/__tests__/useCalendarsListData.test.ts` (1)

**Acceptance Criteria:**

- [ ] `noUncheckedIndexedAccess: true` present in `tsconfig.json`.
- [ ] `npm run typecheck` reports 0 errors.
- [ ] `npm run test` still passes (test fixes must not weaken assertions).
- [ ] Source fixes narrow with real guards/fallbacks, not blanket `!` where a value can legitimately be missing.

**Verify:** `npm run typecheck && npm run test` → 0 type errors, all tests green.

**Steps:**

- [ ] **Step 1: Add the flag.** In `tsconfig.json` compilerOptions add:

```jsonc
    "noUncheckedIndexedAccess": true,
```

- [ ] **Step 2: Enumerate.** Run `npm run typecheck`. Expect 46 errors (codes: 34×TS2532, 5×TS18048, 4×TS2345, 2×TS2322, 1×TS2339). Work file-by-file.

- [ ] **Step 3: Fix source files.** Apply the smallest correct narrowing per error category:
  - **Deterministic-by-construction index** (a value you just pushed, a modular index like `colors[id % colors.length]`, a loop index within bounds): use a non-null assertion `arr[i]!` — the access is provably in-bounds. The `calendarColor.ts` / `avatarColor.ts` palette lookups (`PALETTE[hash % PALETTE.length]`) are this case.
  - **Genuinely optional lookup** (map/record by a key that may be absent): add a guard or fallback. Example:

```typescript
const first = items[0];
if (!first) return null; // or a sensible default
use(first);
```

- **Destructuring from a possibly-short array** (`monthUtils`, `useCalendarsListData`, `CustomTabBar` tab arrays): guard length or provide defaults before use.

Choose the assertion form ONLY when the index is provably valid; otherwise guard. Read each error's surrounding code before deciding.

- [ ] **Step 4: Fix test files.** Tests index into known fixtures/results. The idiomatic fix in tests is a non-null assertion on the indexed access, since the test author controls the data and an out-of-bounds access SHOULD throw and fail the test. Example:

```typescript
// before
expect(result.current.weeks[0].days[3].dateString).toBe('2026-05-04');
// after
expect(result.current.weeks[0]!.days[3]!.dateString).toBe('2026-05-04');
```

Do not change expected values or delete assertions — only add `!` to the indexed accesses TypeScript flags. Re-run the specific test file after editing.

- [ ] **Step 5: Verify.**

Run: `npm run typecheck && npm run test`
Expected: 0 type errors; all tests pass.

- [ ] **Step 6: Commit.**

```bash
git add tsconfig.json src
git commit -m "chore: enable noUncheckedIndexedAccess and fix unsafe index access"
```

---

## Task 3: Tier 1c — `exactOptionalPropertyTypes`

**Goal:** Enable `exactOptionalPropertyTypes` (distinguish absent props from `undefined`-valued props) and fix the 14 errors at component-prop and PowerSync-update boundaries.

**Files:**

- Modify: `tsconfig.json`
- Modify: `App.tsx` (107), `src/components/calendars/EditGroupCard.tsx` (58, 76), `src/components/schedule/CalendarContainer.tsx` (111, 113), `src/components/schedule/EventCard.tsx` (33, 39), `src/components/schedule/EventFeed.tsx` (141, 156), `src/screens/CalendarDetailScreen.tsx` (157), `src/screens/CalendarsScreen.tsx` (422), `src/screens/CreateCalendarScreen.tsx` (604), `src/screens/CreateEventScreen.tsx` (169), `src/database/connector.ts` (190)

**Acceptance Criteria:**

- [ ] `exactOptionalPropertyTypes: true` present in `tsconfig.json`.
- [ ] `npm run typecheck` reports 0 errors.
- [ ] `npm run test` passes.

**Verify:** `npm run typecheck && npm run test` → 0 errors.

**Steps:**

- [ ] **Step 1: Add the flag.**

```jsonc
    "exactOptionalPropertyTypes": true,
```

- [ ] **Step 2: Enumerate.** Run `npm run typecheck`. Expect 14 errors (11×TS2375, 2×TS2379, 1×TS2769). Two distinct fix families below.

- [ ] **Step 3: Fix component-prop boundaries (TS2375 — most of them).** These are JSX props passed as `prop={maybeUndefined}` where the prop type is `prop?: T` (not `prop?: T | undefined`). Two acceptable fixes — prefer (a):
  - **(a) Conditionally spread the prop** so it's omitted when undefined:

```tsx
// before
<WeekStrip onDateSelected={onDateSelected} markedDates={markedDates} />
// after
<WeekStrip
  {...(onDateSelected ? { onDateSelected } : {})}
  markedDates={markedDates}
/>
```

- **(b) Widen the receiving prop type** to explicitly allow `undefined` when "explicitly set to undefined" is a meaningful state:

```typescript
// in the component's Props interface
onDateSelected?: ((date: string) => void) | undefined;
```

Use (b) for `EditGroupCard` `autoFocus`, `EventCard`/`EventFeed` `onPress`/`onMeatballPress`, `CalendarsScreen` `onDelete`, and the `ClerkProvider` `tokenCache` in `App.tsx` (third-party type — widen the local that feeds it, or conditionally spread). Use (a) where the parent simply shouldn't forward an absent value.

- [ ] **Step 4: Fix PowerSync update/insert boundaries (TS2379 + the schema TS2375).** `CreateCalendarScreen.tsx:604`, `CreateEventScreen.tsx:169`, and `CalendarDetailScreen.tsx:157` build update/insert objects where `description?: string` receives `string | undefined`. Omit the key when undefined rather than assigning `undefined`:

```typescript
// before
const payload = {
  name,
  description: description || undefined,
  color: color || undefined,
};
// after
const payload = {
  name,
  ...(description ? { description } : {}),
  ...(color ? { color } : {}),
};
```

- [ ] **Step 5: Fix `connector.ts:190` (TS2769).** Inspect the overload mismatch — it is the same root cause (an optional field being passed as `undefined`). Apply conditional-spread or adjust the object shape so no property is explicitly `undefined`. Verify the PowerSync upload path still compiles and the connector's `uploadData` signature is unchanged.

- [ ] **Step 6: Verify.**

Run: `npm run typecheck && npm run test`
Expected: 0 errors; tests pass.

- [ ] **Step 7: Commit.**

```bash
git add tsconfig.json src App.tsx
git commit -m "chore: enable exactOptionalPropertyTypes and fix optional-prop boundaries"
```

---

## Task 4: Tier 2a — Type-aware ESLint infra + async-safety rules

**Goal:** Convert `eslint.config.js` to a type-aware flat config using the `typescript-eslint` meta-package, and enable the two highest-value async-safety rules — `no-floating-promises` and `no-misused-promises` — as errors, fixing all violations. These catch unawaited PowerSync writes and async handlers passed where `void` is expected.

**Files:**

- Modify: `package.json` (add `typescript-eslint` dep; remove now-redundant separate `@typescript-eslint/*` if desired)
- Modify: `eslint.config.js` (whole file restructure)
- Modify: source files with floating/misused promises (discovered at execute time)

**Acceptance Criteria:**

- [ ] `typescript-eslint` installed; `eslint.config.js` uses `projectService: true`.
- [ ] `@typescript-eslint/no-floating-promises` and `no-misused-promises` are `error`.
- [ ] `npm run lint` reports 0 errors and type-aware rules are active (verify by temporarily adding an unawaited promise and seeing it flagged, then revert).
- [ ] JS config files (`*.js`) are exempt from type-aware rules (no parser errors on `babel.config.js` etc.).

**Verify:** `npm run lint` → 0 errors; `npx eslint src/database/connector.ts --rule '{}'` runs without "parserServices" errors.

**Steps:**

- [ ] **Step 1: Install the meta-package.**

```bash
npm install --save-dev typescript-eslint
```

- [ ] **Step 2: Restructure `eslint.config.js`** to enable type-aware linting. Replace the file with the config below. It preserves the existing React/React-Native/Prettier setup, adds `projectService`, enables the two async rules, and disables type-aware rules on JS files:

```js
const { FlatCompat } = require('@eslint/eslintrc');
const js = require('@eslint/js');
const tseslint = require('typescript-eslint');
const reactPlugin = require('eslint-plugin-react');
const reactHooksPlugin = require('eslint-plugin-react-hooks');
const reactNativePlugin = require('eslint-plugin-react-native');
const prettierPlugin = require('eslint-plugin-prettier');

const compat = new FlatCompat({ baseDirectory: __dirname });

module.exports = tseslint.config(
  js.configs.recommended,
  ...compat.extends('plugin:prettier/recommended'),
  {
    files: ['**/*.js'],
    ...tseslint.configs.disableTypeChecked,
    languageOptions: {
      globals: {
        module: 'readonly',
        require: 'readonly',
        __dirname: 'readonly',
        process: 'readonly',
        global: 'readonly',
        jest: 'readonly',
      },
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
        ecmaFeatures: { jsx: true },
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        __DEV__: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        require: 'readonly',
        module: 'readonly',
        __dirname: 'readonly',
        process: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'react-native': reactNativePlugin,
      prettier: prettierPlugin,
    },
    settings: { react: { version: 'detect' } },
    rules: {
      // --- existing rules (preserved) ---
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/jsx-uses-react': 'off',
      'react/jsx-uses-vars': 'error',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-native/no-inline-styles': 'warn',
      'react-native/no-color-literals': 'warn',
      'react-native/no-raw-text': 'off',
      'react-native/no-unused-styles': 'error',
      'react-native/split-platform-components': 'error',
      'prettier/prettier': 'error',
      'no-console': 'off',
      'no-unused-vars': 'off',
      // --- Tier 2a: async safety (NEW) ---
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
    },
  },
  {
    files: ['**/__tests__/**/*.{ts,tsx}', '**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        beforeEach: 'readonly',
        afterAll: 'readonly',
        afterEach: 'readonly',
        jest: 'readonly',
      },
    },
  },
  {
    ignores: [
      'node_modules/',
      '.expo/',
      'android/',
      'ios/',
      'dist/',
      'web-build/',
      'coverage/',
      'components/ui/**',
      '.claude/worktrees/**',
    ],
  }
);
```

- [ ] **Step 2b: Remove redundant deps (optional).** The `typescript-eslint` meta-package re-exports the parser and plugin, so `@typescript-eslint/eslint-plugin` and `@typescript-eslint/parser` can be dropped from `package.json` devDependencies. Only do this after Step 4 passes. If removed, run `npm install` again.

- [ ] **Step 3: Run lint and enumerate async violations.**

Run: `npm run lint`
Expected: a set of `no-floating-promises` / `no-misused-promises` errors (count discovered at execute time — concentrated in PowerSync writes, navigation handlers, and `onPress={async ...}` callbacks).

- [ ] **Step 4: Fix each violation** with the correct intent — NOT a blanket `void`:
  - **Fire-and-forget that genuinely shouldn't block UI** (e.g. a logging/telemetry call): prefix with `void`: `void doThing();`.
  - **Should be awaited** (the result/error matters, e.g. a DB write whose failure must surface): make the enclosing function `async` and `await` it, or chain `.catch()` with real handling.
  - **`onPress={async () => {...}}` (no-misused-promises)**: wrap so the handler returns `void`:

```tsx
// before
<Pressable onPress={async () => { await save(); }} />
// after
<Pressable onPress={() => { void save(); }} />
```

Decide per-call-site by reading what the promise does. Do not silence by disabling the rule.

- [ ] **Step 5: Confirm rule is actually type-aware.** Temporarily add `Promise.resolve();` (bare) to a source file, run `npm run lint`, confirm it errors, then remove it.

- [ ] **Step 6: Verify full check.**

Run: `npm run check`
Expected: lint + format + typecheck + test all pass.

- [ ] **Step 7: Commit.**

```bash
git add eslint.config.js package.json package-lock.json src App.tsx
git commit -m "chore: add type-aware eslint with floating/misused-promise rules"
```

---

## Task 5: Tier 2b — Strict type-safety rule set

**Goal:** Enable the remaining high-value `strictTypeChecked` rules that require type info, as errors, and fix all violations. These catch `any` leaking through boundaries and dead/incorrect conditionals.

**Files:**

- Modify: `eslint.config.js` (add rules to the TS block)
- Modify: source files flagged (discovered at execute time)

**Acceptance Criteria:**

- [ ] The rules below are `error` in `eslint.config.js`.
- [ ] `npm run lint` reports 0 errors.
- [ ] No rule silenced via blanket `eslint-disable` — fixes address the underlying type.

**Verify:** `npm run lint` → 0 errors.

**Steps:**

- [ ] **Step 1: Add the rules** to the `rules` block of the `*.ts/*.tsx` config in `eslint.config.js`:

```js
      // --- Tier 2b: type-safety ---
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'error',
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true, allowBoolean: true }],
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
```

- [ ] **Step 2: Enumerate.** Run `npm run lint`. Triage by file. The `no-unsafe-*` cluster will concentrate at untyped third-party boundaries (PowerSync query rows, navigation params, JSON parsing).

- [ ] **Step 3: Fix.** Preferred remedies in order:
  - Add/import a proper type or generic at the boundary (e.g. type PowerSync query results via the existing Zod schemas in `src/database/schemas/` — `Schema.parse(row)` yields a typed value and removes the `any`).
  - Narrow with a type guard or `instanceof`/`typeof` check.
  - For `no-unnecessary-condition` flagging an always-truthy/falsy check, remove the dead branch (it indicates the type already guarantees the value).
  - Only as a last resort for a genuinely-external untyped value, cast through a validated boundary — never `as any`.

- [ ] **Step 4: Verify.**

Run: `npm run check`
Expected: all pass.

- [ ] **Step 5: Commit.**

```bash
git add eslint.config.js src App.tsx
git commit -m "chore: enable strict type-safety eslint rules"
```

---

## Task 6: Tier 2c — Stylistic type-checked rules + consistent type imports

**Goal:** Add `stylisticTypeChecked` ergonomics and enforce `consistent-type-imports` (improves build/HMR perf by separating type-only imports). Lower priority — drop if Tier 2b churn was large.

**Files:**

- Modify: `eslint.config.js`
- Modify: source import statements (auto-fixable)

**Acceptance Criteria:**

- [ ] `@typescript-eslint/consistent-type-imports` is `error`.
- [ ] Selected stylistic rules enabled and green.
- [ ] `npm run lint` reports 0 errors (after `--fix`).

**Verify:** `npm run lint` → 0 errors.

**Steps:**

- [ ] **Step 1: Add rules** to the TS `rules` block:

```js
      // --- Tier 2c: stylistic + ergonomics ---
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports', fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
```

- [ ] **Step 2: Auto-fix the mechanical ones.**

Run: `npm run lint:fix`
Most `consistent-type-imports`, `prefer-optional-chain`, and `no-unnecessary-type-assertion` violations auto-fix.

- [ ] **Step 3: Manually resolve `prefer-nullish-coalescing`** where `||` is flagged but `??` would change behavior (e.g. `''`/`0` are valid values). Read each — if `||` is intentional for falsy-coalescing, keep `||` and add a scoped `// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing` with a one-line reason; otherwise switch to `??`.

- [ ] **Step 4: Verify.**

Run: `npm run check`
Expected: all pass.

- [ ] **Step 5: Commit.**

```bash
git add eslint.config.js src App.tsx
git commit -m "chore: enable stylistic type-checked eslint rules and consistent type imports"
```

---

## Task 7: Tier 3a — Promote `no-explicit-any` and `exhaustive-deps` to error

**Goal:** Turn the two existing `warn` rules into `error` so they block CI, and fix outstanding violations.

**Files:**

- Modify: `eslint.config.js`
- Modify: source files with `any` or missing/incorrect hook deps

**Acceptance Criteria:**

- [ ] `@typescript-eslint/no-explicit-any` and `react-hooks/exhaustive-deps` are `error`.
- [ ] `npm run lint` reports 0 errors.
- [ ] `exhaustive-deps` fixes add the real missing dep or correctly memoize — not a blanket disable.

**Verify:** `npm run lint` → 0 errors.

**Steps:**

- [ ] **Step 1: Flip the rules** in `eslint.config.js`:

```js
      '@typescript-eslint/no-explicit-any': 'error',
      'react-hooks/exhaustive-deps': 'error',
```

- [ ] **Step 2: Enumerate.** Run `npm run lint`.

- [ ] **Step 3: Fix `no-explicit-any`.** Replace each `any` with `unknown` + narrowing, a precise type, or a generic. If a third-party type is genuinely `any`, isolate it behind a typed wrapper. (Note: Tier 2b's `no-unsafe-*` rules likely already forced most of these — expect few remaining.)

- [ ] **Step 4: Fix `exhaustive-deps`.** For each warning, add the missing dependency. If adding it would cause a loop, restructure with `useCallback`/`useRef` or move the value out — do NOT suppress. Re-run tests after touching effect deps, since these are behavioral.

Run: `npm run test`
Expected: all pass.

- [ ] **Step 5: Verify + commit.**

```bash
npm run check
git add eslint.config.js src App.tsx
git commit -m "chore: promote no-explicit-any and exhaustive-deps to error"
```

---

## Task 8: Tier 3b — Import-cycle and import-order enforcement

**Goal:** Add `eslint-plugin-import-x` to catch circular dependencies (which break Metro silently) and enforce import ordering.

**Files:**

- Modify: `package.json` (add `eslint-plugin-import-x`)
- Modify: `eslint.config.js`
- Modify: `knip.config.ts` (ignore the new dep if Knip flags it)
- Modify: source files with cycles / out-of-order imports

**Acceptance Criteria:**

- [ ] `eslint-plugin-import-x` installed and wired with the TypeScript resolver.
- [ ] `import-x/no-cycle` and `import-x/order` are `error`.
- [ ] `npm run lint` reports 0 errors.
- [ ] `npm run knip` still passes.

**Verify:** `npm run lint && npm run knip` → 0 errors.

**Steps:**

- [ ] **Step 1: Install.**

```bash
npm install --save-dev eslint-plugin-import-x eslint-import-resolver-typescript
```

- [ ] **Step 2: Wire into `eslint.config.js`.** Add the plugin import at top:

```js
const importX = require('eslint-plugin-import-x');
```

Add to the TS config's `plugins`: `'import-x': importX,`. Add to `settings`:

```js
    settings: {
      react: { version: 'detect' },
      'import-x/resolver': {
        typescript: { project: './tsconfig.json' },
      },
    },
```

Add to `rules`:

```js
      'import-x/no-cycle': ['error', { maxDepth: Infinity }],
      'import-x/order': ['error', {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        pathGroups: [{ pattern: '@/**', group: 'internal' }],
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true },
      }],
```

- [ ] **Step 3: Auto-fix ordering.** Run `npm run lint:fix` — `import-x/order` is auto-fixable.

- [ ] **Step 4: Resolve cycles manually.** `no-cycle` is NOT auto-fixable. For each reported cycle, break it by extracting the shared type/constant into a leaf module both sides import, or invert a dependency. Cycles commonly appear around barrel files (`src/screens/index.ts`, `src/components/.../index.ts`) — prefer importing the concrete module over the barrel at the cycle edge.

- [ ] **Step 5: Knip.** Run `npm run knip`. If it flags `eslint-import-resolver-typescript` as unused (it's referenced only via ESLint settings), add it to `ignoreDependencies` in `knip.config.ts`.

- [ ] **Step 6: Verify + commit.**

```bash
npm run check && npm run knip
git add eslint.config.js package.json package-lock.json knip.config.ts src App.tsx
git commit -m "chore: enforce import-cycle detection and import ordering"
```

---

## Task 9: Tier 3c — Close CI gaps (Knip + ts-reset)

**Goal:** Make Knip a CI gate (it exists but isn't run in the pipeline), add it to the local `check` script, and adopt `@total-typescript/ts-reset` for safer built-in lib types.

**Files:**

- Modify: `.github/workflows/ci.yml` (add Knip step)
- Modify: `package.json` (`check` script + `@total-typescript/ts-reset` dep)
- Create: `src/types/ts-reset.d.ts`
- Modify: `knip.config.ts` (ignore ts-reset)
- Modify: source files newly flagged by ts-reset's stricter lib types

**Acceptance Criteria:**

- [ ] CI runs `npm run knip` and fails on findings.
- [ ] `npm run check` includes `knip`.
- [ ] `ts-reset` imported once via `src/types/ts-reset.d.ts`.
- [ ] `npm run typecheck` passes with ts-reset's stricter types (e.g. `JSON.parse` → `unknown`, `.filter(Boolean)` narrowing).

**Verify:** `npm run check && npm run knip` → all green; CI workflow includes a Knip step.

**Steps:**

- [ ] **Step 1: Add Knip to CI.** In `.github/workflows/ci.yml`, add a step after "Type check":

```yaml
- name: Knip (unused code/deps)
  run: npm run knip
```

- [ ] **Step 2: Add Knip to the local `check` script** in `package.json`:

```json
    "check": "npm run lint && npm run format:check && npm run typecheck && npm run knip && npm run test",
```

- [ ] **Step 3: Install ts-reset.**

```bash
npm install --save-dev @total-typescript/ts-reset
```

- [ ] **Step 4: Create `src/types/ts-reset.d.ts`** with a single line:

```typescript
import '@total-typescript/ts-reset';
```

Confirm `tsconfig.json` `include` (`**/*.ts`) already covers it — it does.

- [ ] **Step 5: Fix new type errors.** Run `npm run typecheck`. ts-reset makes `JSON.parse()` and `response.json()` return `unknown`, and tightens `.filter(Boolean)`, `array.includes`, `Object.keys`. For each new error, parse/validate the `unknown` (ideally via the relevant Zod schema in `src/database/schemas/`) before use. These are real safety improvements — fix at the boundary, don't cast.

- [ ] **Step 6: Knip ignore.** Run `npm run knip`. Add `@total-typescript/ts-reset` to `ignoreDependencies` in `knip.config.ts` (it's used only via the ambient import).

- [ ] **Step 7: Verify + commit.**

```bash
npm run check && npm run knip
git add .github/workflows/ci.yml package.json package-lock.json src/types/ts-reset.d.ts knip.config.ts src
git commit -m "chore: gate knip in CI and adopt ts-reset for safer lib types"
```

---

## Self-Review Notes

- **Spec coverage:** All three tiers from the research are covered — Tier 1 (Tasks 1-3: the 6 tsconfig flags), Tier 2 (Tasks 4-6: type-aware ESLint incl. floating-promises), Tier 3 (Tasks 7-9: rule promotions, import-cycle, Knip-in-CI, ts-reset).
- **Sequencing:** Tasks 1→2→3 share `tsconfig.json`; Tasks 4→5→6→7→8 share `eslint.config.js`. Run in order to avoid conflicts. Task 9 is largely independent but ordered last so ts-reset's `unknown`-returns land after the type-safety rules exist to enforce handling.
- **No placeholders:** Tier 1 fixes are enumerated to exact files/lines with measured counts. Tier 2/3 violation _counts_ are discovered at execute time by design (enabling a rule reveals its violations) — each task gives the exact enabling diff plus a concrete decision table for fixes, and the hard gate is "command reports 0 errors."
- **Risk flag:** Task 1's generated-file edit (`form-control/index.tsx`) can be reverted by Gluestack re-scaffolding — noted in-task.
