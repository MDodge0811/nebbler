---
paths:
  - 'eslint.config.js'
  - '.prettierrc'
  - 'tsconfig.json'
  - 'knip.config.ts'
  - '.github/**'
  - 'src/database/schemas/**'
  - 'src/types/**'
---

# Code Quality Rules

## Linting (ESLint)

- Config: `eslint.config.js` (flat config format, ESLint v9)
- Plugins: TypeScript, React, React Hooks, React Native, Prettier
- Test files (`__tests__/`, `*.test.ts`, `*.spec.ts`) have Jest globals (`describe`, `it`, `expect`, `jest`, etc.) available automatically
- JS config files have `global`, `jest`, `module`, `require` globals
- The `URL` global is available in TS files
- **Cyclomatic complexity is enforced**: `complexity: ['error', { max: 12 }]` — CI fails above 12. Drivers: `if/for/while/case/catch`, `?:`, `&&`, `||`, `??`, and `?.`. `useCallback`/`useEffect`/`.map()` arrows count as **separate** functions, so moving JSX/handlers out of a component body is the highest-leverage fix. Functions scoring 11 are fine — don't over-decompose.

## Styling Contract (enforced as hard lint errors)

NativeWind `className` + Gluestack is the **only** sanctioned styling path. These
rules fail `npm run lint` (and the pre-commit hook):

- `react-native/no-inline-styles` + `react-native/no-color-literals` are **errors**, not warnings.
- `no-restricted-syntax` bans `StyleSheet.create` — use `tva()` + `className`.
- `@typescript-eslint/no-restricted-imports` bans `View`/`Text`/`Pressable`/`Image`/`TouchableOpacity`
  from `react-native`. Use Gluestack instead: `View`→`@/components/ui/box` (`Box`),
  `Text`→`@/components/ui/text`, `Pressable`→`@/components/ui/pressable`,
  `Image`/`TouchableOpacity`→`Pressable`+`Box`. `Animated`/`ScrollView`/`FlatList`/
  `SectionList`/`KeyboardAvoidingView`/`Platform`/`ViewStyle` stay on `react-native`.

**The named door for runtime (non-`className`) styling:** `components/ui/dynamic/`
(`DynamicColorView` for runtime background/border/shadow color, `zIndex`, drag-driven
`top`, inset-driven padding; `DynamicColorText` for runtime text color). Anything that
genuinely can't be a static class goes through these primitives — never an inline
`style={{...}}` or `eslint-disable`.

**Path-exempt files** (inline styles + color literals allowed because they do
reanimated/runtime-dimension work the door can't express): `components/ui/dynamic/**`,
`src/components/calendars/CalendarCheckbox.tsx`, `src/components/SyncStatusIndicator.tsx`,
`src/components/schedule/week-strip/WeekStrip.tsx`,
`src/components/schedule/month-grid/MonthGrid.tsx`. This list is **closed** — fix new
lint errors by migrating to `tva()`/`DynamicColorView`, never by widening the exempt
list or adding `eslint-disable`. Growing the list needs explicit user sign-off.

Color tokens are in `components/ui/gluestack-ui-provider/config.ts` (CSS vars, light+dark)
mapped through `tailwind.config.js`. Brand chrome hexes with no exact palette match live
under the `brand-*` namespace; add new ones to **both** config blocks, the
`tailwind.config.js` `brand` color map, and the safelist regex. Tokens must be
byte-exact hex, never near-matches.

## Formatting (Prettier)

- Config: `.prettierrc`
- Key settings: semicolons, single quotes, 100 char print width, 2-space indent, ES5 trailing commas

## Type Checking (TypeScript)

- Config: `tsconfig.json` (extends `expo/tsconfig.base`)
- Strict mode enabled
- Module resolution: `bundler`
- Untyped third-party modules get declarations in `src/types/` (e.g., `react-native-polyfill-globals.d.ts`)
- `noUncheckedIndexedAccess` is on: `arr[i]` / `obj[key]` are `T | undefined` — guard or use `?.` (commonly bites typed test mocks like `mock.calls[i]?.[0]`)
- `exactOptionalPropertyTypes` is on: an optional prop that may receive explicit `undefined` must be typed `?: T | undefined`
- `npm run check` = `lint && format:check && typecheck && test` (lint runs first and stops the chain on failure). Don't pipe it through `tail`/`head` to check the exit code — the pipeline reports the pager's status (0), masking real failures.

## Unused Code Detection (Knip)

- Config: `knip.config.ts`
- Detects: unused files, exports, types, and dependencies
- Run `npm run knip` to check — exits non-zero when findings exist
- Some dependencies are in `ignoreDependencies` because they're used implicitly (Expo native linking, babel plugins, peer deps)
- If you add a new config file (e.g., `foo.config.js`), add it to the `ignore` array in `knip.config.ts`
- If you add a new implicitly-used dependency, add it to `ignoreDependencies`

## CI/CD (GitHub Actions)

Workflow: `.github/workflows/ci.yml`

Runs on PRs to `main` and pushes to `main`. Steps: install → lint → format:check → typecheck → test (with coverage). Uses Node.js version from `.nvmrc`.

### Coverage Enforcement (Istanbul via Jest)

Coverage thresholds are enforced per-glob in `jest.config.js` → `coverageThreshold`. The test command fails if any threshold is violated.

Current thresholds:

| Glob                      | Branches | Functions | Lines | Statements |
| ------------------------- | -------- | --------- | ----- | ---------- |
| `src/database/schemas/**` | 90%      | 90%       | 90%   | 90%        |

**Adding new thresholds:** When a directory reaches good coverage, add it to `coverageThreshold`. Set thresholds slightly below current coverage to allow minor fluctuations.

> The pre-Clerk `src/services/**` threshold was removed when `authService` moved to Clerk's SDK. If you add new modules under `src/services/`, re-add a corresponding row and pin `jest.config.js` to match.

### Branch Protection

`main` has branch protection enabled:

- The **Code Quality & Tests** CI job must pass before merging
- Branch must be up-to-date with `main` before merging (`strict: true`)

## Runtime Validation (Zod)

- Schemas are in `src/database/schemas/`
- Use `z.string().refine()` with `new URL()` instead of `z.string().url()` for URL validation — supports `http://localhost:*` development URLs
- Export Zod-inferred types alongside schemas: `export type Foo = z.infer<typeof FooSchema>`

**When to add Zod schemas:**

- Any data crossing a trust boundary (API responses, external config, user input)
- Use `.parse()` when the data must be valid (throw on failure)
- Use `.safeParse()` when you want to handle errors gracefully
