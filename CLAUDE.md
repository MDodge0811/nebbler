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

**Coverage:** Codecov enforces 80% patch coverage on PRs (changed lines must be tested). See `codecov.yml`.

## Project Structure

```
src/
├── components/     # Reusable UI components
├── screens/        # Screen components (ScheduleScreen, HomeScreen, ProfileScreen, SettingsScreen, auth/)
├── navigation/     # React Navigation config (stack + drawer + bottom tabs + auth)
├── hooks/          # Custom React hooks (useCurrentUser, useTestItems, useAuth, useAuthMutations)
├── context/        # React contexts (AuthContext)
├── services/       # API service layer (authService)
├── database/       # PowerSync database layer (schema, connector, sync)
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

## Domain-Specific Rules

Detailed patterns are in `.claude/rules/` — auto-loaded when you work on matching files:

| Domain        | Files scoped to                                      | What it covers                                                      |
| ------------- | ---------------------------------------------------- | ------------------------------------------------------------------- |
| PowerSync     | `src/database/`, `src/hooks/`                        | Schema, connector, sync, offline-first patterns                     |
| Auth          | `src/context/`, `src/services/`, `src/screens/auth/` | Auth flow, TanStack mutations, secure storage, two-layer user model |
| Testing       | `__tests__/`, `jest.setup.js`                        | Jest config, mocking patterns, gotchas                              |
| Navigation    | `src/navigation/`, `src/screens/`                    | Nav hierarchy, routing, adding screens                              |
| UI Components | `src/components/`                                    | Icons, Gluestack UI, calendars, colors                              |
| Code Quality  | config files, `src/database/schemas/`                | ESLint, Prettier, TS, Knip, Zod, CI/CD                              |

See `.claude/rules/rules.md` for the full index.
