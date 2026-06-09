# CLAUDE.md — Nebbler Mobile App

Guidance for AI agents working on the Nebbler mobile app.

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
./bin/start            # Start Expo (auto-detects worktree ports)
./bin/health           # Check API + PowerSync health
```

**Always run `npm run check` before committing** to catch issues early.

**Worktree:** `bin/start` and `bin/health` auto-detect if running in a worktree by checking `../api/.env`. In the main repo they use default ports. See root `AGENTS.md` for full worktree workflow.

**Coverage:** Per-glob Istanbul thresholds in `jest.config.js` — CI fails if covered directories drop below their minimums.

## Project Structure

```
src/
├── components/     # Reusable UI components
├── screens/        # Screen components (ScheduleScreen, HomeScreen, ProfileScreen, SettingsScreen, auth/{Login,SignUp,VerifyCode})
├── navigation/     # React Navigation config (stack + drawer + bottom tabs + auth)
├── hooks/          # Custom React hooks (useAuth adapter, useCurrentUser, useTestItems, …)
├── database/       # PowerSync database layer (schema, connector, sync) + Clerk token wiring
├── constants/      # App constants (config with dynamic port detection, colors)
├── types/          # TypeScript type declarations
└── utils/          # Utility functions (secureStorage — generic K/V, not Clerk tokens)
```

Auth is provided by **Clerk** (`@clerk/clerk-expo`). There is no `src/context/AuthContext` or `src/services/authService` — `App.tsx` wraps everything in `<ClerkProvider>` and a `ClerkPowerSyncBridge` coordinates connect/disconnect against PowerSync.

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
| `@stores/*`     | `src/stores/*`     |
| `@api/*`        | `src/api/*`        |

**If you add a new path alias**, you must update all three files: `tsconfig.json`, `babel.config.js`, and `jest.config.js` (`moduleNameMapper`).

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

## Architecture Boundaries (enforced)

`eslint.config.js` is the **authoritative** architecture contract — these rules fail `npm run lint` (and the pre-commit hook), so they are hard checks, not conventions.

**Vendor containment (`no-restricted-imports`).** Each paid/swappable SDK has one "home"; importing it elsewhere is an error pointing at the adapter to use. This is what keeps swapping a provider a single-file change.

| SDK                                                                                     | Only importable in                                             |
| --------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `@clerk/**`                                                                             | `src/hooks/useAuth.ts`, `src/hooks/useAuthFlows.ts`, `App.tsx` |
| `@powersync/op-sqlite`, `@powersync/react-native`, `@op-engineering/op-sqlite` (engine) | `src/database/**`, `App.tsx`                                   |
| `@powersync/react` (`useQuery`/`usePowerSync`/`useStatus`)                              | `src/hooks/**`, `src/database/**`, `App.tsx`                   |
| `expo-secure-store`                                                                     | `src/utils/secureStorage.ts`                                   |
| `@tanstack/react-query`                                                                 | `src/hooks/**`, `src/api/**`, `App.tsx`                        |

Everything else reaches these through an adapter: `useAuth()` / `useSignInFlow()` / … for auth, a hook for PowerSync, `secureStorage` for storage.

**Layer direction (`eslint-plugin-boundaries`, default-disallow).** `src/` is tagged into element types (`type`, `constant`, `util`, `store`, `data`, `api`, `hook`, `component`, `screen`, `nav`) with an allow-list in `eslint.config.js`. Anything not allowed errors; a new file in an unclassified location errors (`no-unknown-files`). Notable prohibitions: `component`↛`screen`/`nav`, `util`↛`hook`/`component`/`screen`, `type`↛anything, `data`↛anything but `constant`/`type`. To add a new layer or edge, edit the allow-list — that file is the source of truth; the prose here just summarizes it.

## Domain-Specific Rules

Detailed patterns are in `.claude/rules/` — auto-loaded when you work on matching files:

| Domain        | Files scoped to                                                                     | What it covers                                                                         |
| ------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| PowerSync     | `src/database/`, `src/hooks/`                                                       | Schema, connector, sync, offline-first patterns                                        |
| Auth          | `src/screens/auth/`, `src/hooks/useAuth.ts`, `src/hooks/useAuthFlows.ts`, `App.tsx` | Clerk adapter, sign-up / sign-in / OAuth flows, two-layer user model, PowerSync bridge |
| Testing       | `__tests__/`, `jest.setup.js`                                                       | Jest config, mocking patterns, gotchas                                                 |
| Navigation    | `src/navigation/`, `src/screens/`                                                   | Nav hierarchy, routing, adding screens                                                 |
| UI Components | `src/components/`                                                                   | Icons, Gluestack UI, calendars, colors                                                 |
| State Mgmt    | `src/stores/`                                                                       | Zustand stores                                                                         |
| Code Quality  | config files, `src/database/schemas/`                                               | ESLint, Prettier, TS, Knip, Zod, CI/CD                                                 |

See `.claude/rules/rules.md` for the full index.
