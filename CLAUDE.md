# CLAUDE.md

This file provides guidance for AI agents (Claude, Cursor, Copilot, etc.) working on the Nebbler codebase.

## Project Overview

Nebbler is a React Native mobile app built with Expo SDK 54, TypeScript, and PowerSync for offline-first data sync. It targets iOS, Android, and web.

**Key technologies:** React 19, React Native 0.81, Expo ~54, PowerSync, op-sqlite, React Navigation 7

## Quick Reference

```bash
npm run check          # Run ALL quality checks (lint + format + typecheck + test)
npm run test           # Run Jest tests
npm run test:watch     # Jest in watch mode
npm run lint           # ESLint
npm run lint:fix       # ESLint with auto-fix
npm run format         # Prettier write
npm run format:check   # Prettier check
npm run typecheck      # TypeScript type checking
npm run knip           # Detect unused code, exports, and dependencies
npm run test:coverage  # Jest with coverage report
```

**Always run `npm run check` before committing** to catch issues early.

## Project Structure

```
src/
├── components/     # Reusable UI components
├── screens/        # Screen components (HomeScreen, SettingsScreen, auth/)
├── navigation/     # React Navigation config (stack + bottom tabs + auth)
├── hooks/          # Custom React hooks (useTestItems, useAuth, useAuthMutations)
├── context/        # React contexts (AuthContext)
├── services/       # API service layer (authService)
├── database/       # PowerSync database layer
│   ├── schema.ts       # Table definitions (must match backend Postgres + sync rules)
│   ├── database.ts     # Singleton DB initialization and lifecycle
│   ├── connector.ts    # Backend API communication (auth + CRUD upload)
│   └── schemas/        # Zod runtime validation schemas
├── constants/      # App constants (config, colors)
├── types/          # TypeScript type declarations
└── utils/          # Utility functions
```

## Path Aliases

Always use path aliases instead of relative imports. These are configured in `tsconfig.json`, `babel.config.js`, and `jest.config.js`:

| Alias           | Path               |
| --------------- | ------------------ |
| `@/*`           | `src/*`            |
| `@components/*` | `src/components/*` |
| `@screens/*`    | `src/screens/*`    |
| `@navigation/*` | `src/navigation/*` |
| `@hooks/*`      | `src/hooks/*`      |
| `@utils/*`      | `src/utils/*`      |
| `@constants/*`  | `src/constants/*`  |
| `@types/*`      | `src/types/*`      |
| `@database/*`   | `src/database/*`   |
| `@context/*`    | `src/context/*`    |
| `@services/*`   | `src/services/*`   |

**If you add a new path alias**, you must update all three files: `tsconfig.json`, `babel.config.js`, and `jest.config.js` (`moduleNameMapper`).

## Code Quality Tools

### Linting (ESLint)

- Config: `eslint.config.js` (flat config format, ESLint v9)
- Plugins: TypeScript, React, React Hooks, React Native, Prettier
- Test files (`__tests__/`, `*.test.ts`, `*.spec.ts`) have Jest globals (`describe`, `it`, `expect`, `jest`, etc.) available automatically
- JS config files have `global`, `jest`, `module`, `require` globals
- The `URL` global is available in TS files

### Formatting (Prettier)

- Config: `.prettierrc`
- Key settings: semicolons, single quotes, 100 char print width, 2-space indent, ES5 trailing commas
- Runs automatically on save (VS Code) and on pre-commit via lint-staged

### Type Checking (TypeScript)

- Config: `tsconfig.json` (extends `expo/tsconfig.base`)
- Strict mode enabled
- Module resolution: `bundler`
- Untyped third-party modules get declarations in `src/types/` (e.g., `react-native-polyfill-globals.d.ts`)

### Testing (Jest + React Native Testing Library)

- Config: `jest.config.js`
- Preset: `jest-expo` (handles RN transforms, asset mocking, platform resolution)
- Setup file: `jest.setup.js` (sets `__DEV__ = true`, mocks native modules)
- Test location: place tests in `__tests__/` directories next to the code they test
- Test naming: `*.test.ts` or `*.test.tsx`

**Writing tests:**

- Pure logic tests (schemas, utils, constants) need no mocking
- Component tests use `@testing-library/react-native` (`render`, `screen`, `fireEvent`, `waitFor`)
- Database/hook tests must mock `@powersync/react` and `@powersync/react-native`
- Native modules (`@op-engineering/op-sqlite`, `@powersync/op-sqlite`) are auto-mocked in `jest.setup.js`

**Adding new native module mocks:** Add `jest.mock('module-name', () => ({...}))` to `jest.setup.js`.

### Unused Code Detection (Knip)

- Config: `knip.config.ts`
- Detects: unused files, exports, types, and dependencies
- Run `npm run knip` to check — it exits non-zero when findings exist
- Some dependencies are in `ignoreDependencies` because they're used implicitly (Expo native linking, babel plugins, peer deps)
- If you add a new config file (e.g., `foo.config.js`), add it to the `ignore` array in `knip.config.ts`
- If you add a new implicitly-used dependency, add it to `ignoreDependencies`

### Runtime Validation (Zod)

- Schemas are in `src/database/schemas/`
- `PowerSyncConfigSchema` validates the config URLs at startup — if a URL is malformed, the app crashes early with a clear error
- `FetchCredentialsResponseSchema` validates API responses from the auth endpoint before using the data
- Use `z.string().refine()` with `new URL()` instead of `z.string().url()` for URL validation — this supports `http://localhost:*` development URLs
- Export Zod-inferred types alongside schemas: `export type Foo = z.infer<typeof FooSchema>`

**When to add Zod schemas:**

- Any data crossing a trust boundary (API responses, external config, user input)
- Use `.parse()` when the data must be valid (throw on failure)
- Use `.safeParse()` when you want to handle errors gracefully

## Git Hooks & Commit Conventions

### Pre-commit (Husky + lint-staged)

Runs automatically on `git commit`:

- `*.{ts,tsx}`: ESLint --fix, then Prettier --write
- `*.{json,md}`: Prettier --write

### Commit Messages (commitlint)

All commits must follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type: short description
```

**Allowed types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`

**Examples:**

```
feat: add user profile screen
fix: resolve sync conflict on reconnect
test: add unit tests for useTestItems hook
chore: update dependencies
```

**Rules:**

- Subject max length: 100 characters
- No start-case, pascal-case, or upper-case subjects
- Multi-line bodies and footers (like `Co-Authored-By:`) are allowed

## CI/CD (GitHub Actions)

Workflow: `.github/workflows/ci.yml`

Runs on PRs to `main` and pushes to `main`. Steps: install → lint → format:check → typecheck → test (with coverage). Uses Node.js version from `.nvmrc`.

## Architecture Notes

### PowerSync / Database Layer

- **Offline-first**: All data reads come from local SQLite. Writes go to a local queue, then sync to the backend.
- **Schema**: `src/database/schema.ts` defines synced tables. These must match the backend Postgres schema and PowerSync sync rules.
- **Connector**: `src/database/connector.ts` handles auth (`POST /api/powersync/auth`) and uploading local changes (`PUT/PATCH/DELETE /api/data/{table}/{id}`).
- **Singleton**: The database is initialized once via `initializeDatabase()` in `src/database/database.ts`.
- **Timestamps**: `inserted_at`/`updated_at` are set locally for immediate UI, but the server overwrites them on sync.
- **IDs**: Client-generated UUID v4 (simple implementation in hooks — `generateUUID()`).

### Hooks Pattern

- Query hooks (e.g., `useTestItems`) return reactive data using `useQuery` from `@powersync/react`
- Mutation hooks (e.g., `useTestItemMutations`) use `usePowerSync()` to get the DB instance and execute raw SQL
- Hooks are in `src/hooks/` and re-exported from `src/hooks/index.ts`

### Navigation

- Root: `NativeStackNavigator` containing `Main` (tabs) and `Details` (stack)
- Tabs: `BottomTabNavigator` with `Home` and `Settings`
- Route types defined in `src/navigation/types.ts`

### Configuration

- `src/constants/config.ts`: PowerSync URLs (dev vs prod via `__DEV__`), validated with Zod at startup
- `src/constants/colors.ts`: Theme color palette

## Common Patterns

### Adding a new synced table

1. Add the table definition in `src/database/schema.ts`
2. Add it to the `AppSchema` object
3. Export the TypeScript type: `export type NewTable = Database['new_table']`
4. Create a hook in `src/hooks/` with query + mutation functions
5. Re-export from `src/hooks/index.ts`
6. Add Zod schemas if the table has API endpoints

### Adding a new screen

1. Create the component in `src/screens/`
2. Add the route to `src/navigation/types.ts`
3. Register in `src/navigation/AppNavigator.tsx`
4. Re-export from `src/screens/index.ts`

### Adding a new API endpoint schema

1. Add the Zod schema in `src/database/schemas/apiSchemas.ts`
2. Export from `src/database/schemas/index.ts`
3. Use `.parse()` or `.safeParse()` on the response in the connector
