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

## Formatting (Prettier)

- Config: `.prettierrc`
- Key settings: semicolons, single quotes, 100 char print width, 2-space indent, ES5 trailing commas

## Type Checking (TypeScript)

- Config: `tsconfig.json` (extends `expo/tsconfig.base`)
- Strict mode enabled
- Module resolution: `bundler`
- Untyped third-party modules get declarations in `src/types/` (e.g., `react-native-polyfill-globals.d.ts`)

## Unused Code Detection (Knip)

- Config: `knip.config.ts`
- Detects: unused files, exports, types, and dependencies
- Run `npm run knip` to check — exits non-zero when findings exist
- Some dependencies are in `ignoreDependencies` because they're used implicitly (Expo native linking, babel plugins, peer deps)
- If you add a new config file (e.g., `foo.config.js`), add it to the `ignore` array in `knip.config.ts`
- If you add a new implicitly-used dependency, add it to `ignoreDependencies`

## CI/CD (GitHub Actions)

Workflow: `.github/workflows/ci.yml`

Runs on PRs to `main` and pushes to `main`. Steps: install → lint → format:check → typecheck → test (with coverage) → upload to Codecov. Uses Node.js version from `.nvmrc`.

### Coverage Enforcement (Codecov)

Config: `codecov.yml` (repo root)

- **Patch coverage** is enforced at **80%** — new/changed lines in a PR must be at least 80% covered by tests (with a 5% grace buffer)
- **Project coverage** is informational only — it shows the trend but doesn't block PRs
- Codecov posts a PR comment with a coverage diff on PRs that affect coverage
- Ignored paths: `src/**/index.ts`, `src/**/*.d.ts`, `src/navigation/**`, `src/types/**`

### Branch Protection

`main` has branch protection enabled:

- The **Code Quality & Tests** CI job must pass before merging
- Branch must be up-to-date with `main` before merging (`strict: true`)
- After the first Codecov run, `codecov/patch` should be added as a required status check

## Runtime Validation (Zod)

- Schemas are in `src/database/schemas/`
- Use `z.string().refine()` with `new URL()` instead of `z.string().url()` for URL validation — supports `http://localhost:*` development URLs
- Export Zod-inferred types alongside schemas: `export type Foo = z.infer<typeof FooSchema>`

**When to add Zod schemas:**

- Any data crossing a trust boundary (API responses, external config, user input)
- Use `.parse()` when the data must be valid (throw on failure)
- Use `.safeParse()` when you want to handle errors gracefully
