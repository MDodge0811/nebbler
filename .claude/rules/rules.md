# Nebbler Mobile App — Rule Index

Rules are organized by domain. Each domain has a top-level file with core patterns and deep-dive files for specific tasks.

## Available Rule Domains

| Domain        | Entry Point                            | When to Read                                                         |
| ------------- | -------------------------------------- | -------------------------------------------------------------------- |
| PowerSync     | `.claude/rules/powersync/powersync.md` | Working with `src/database/`, `src/hooks/`, sync, offline-first data |
| Auth          | `.claude/rules/auth.md`                | Working with login/logout, AuthContext, secure storage, auth service |
| Testing       | `.claude/rules/testing.md`             | Writing tests, modifying jest.setup.js or jest.config.js             |
| Navigation    | `.claude/rules/navigation.md`          | Working with `src/navigation/`, `src/screens/`                       |
| UI Components | `.claude/rules/ui-components.md`       | Working with `src/components/`, icons, Gluestack UI, calendars       |
| Code Quality  | `.claude/rules/code-quality.md`        | Modifying ESLint, Prettier, TS, Knip configs, Zod schemas, CI        |

PowerSync and UI Components have deep-dive sub-files — start with their entry points for an index of deeper references.
