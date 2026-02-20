---
paths:
  - 'src/database/**'
  - 'src/hooks/**'
  - 'src/context/**'
  - 'App.tsx'
---

# PowerSync Rules

Offline-first sync layer between React Native (local SQLite) and PostgreSQL via PowerSync service.

## Architecture

```
React Native (SQLite) ←→ PowerSync Service ←→ PostgreSQL
                                                   ↑
                              Phoenix API ──────────┘
                         (CRUD upload target)
```

1. App reads/writes local SQLite — instant, works offline
2. PowerSync streams Postgres changes down (CDC via logical replication)
3. Local writes queue automatically, upload to Phoenix API via connector
4. API persists to Postgres, PowerSync replicates back to all clients

## Official Docs

PowerSync documentation is AI-friendly. When you need to look something up:

- Append `.md` to any docs URL to get clean markdown (e.g., `https://docs.powersync.com/client-sdks/reference/javascript-web.md`)
- Full docs in one file: `https://docs.powersync.com/llms-full.txt`
- Docs index: `https://docs.powersync.com/llms.txt`

Key reference pages:

- [React Native / Expo SDK](https://docs.powersync.com/client-sdks/reference/react-native-and-expo)
- [React hooks](https://docs.powersync.com/client-sdks/reference/react-hooks)
- [Sync rules](https://docs.powersync.com/installation/sync-rules)
- [Debugging](https://docs.powersync.com/usage/tools/debugging)

## File Map

| File                         | Role                                                                   |
| ---------------------------- | ---------------------------------------------------------------------- |
| `src/database/schema.ts`     | PowerSync table definitions (must match backend Postgres + sync rules) |
| `src/database/database.ts`   | Singleton init + connect lifecycle                                     |
| `src/database/connector.ts`  | `PowerSyncBackendConnector` — auth + CRUD upload                       |
| `src/database/schemas/`      | Zod validation for config URLs and API responses                       |
| `src/constants/config.ts`    | PowerSync + backend URLs (dev/prod), validated with Zod                |
| `src/hooks/use*.ts`          | Query hooks (`useQuery`) and mutation hooks (`usePowerSync`)           |
| ~~`src/utils/uuid.ts`~~      | Removed — UUIDs now generated via PowerSync's built-in `uuid()` in SQL |
| `src/utils/secureStorage.ts` | Token persistence for auth                                             |
| `App.tsx`                    | `<PowerSyncContext.Provider>` wrapping the app                         |

## Packages

```
@powersync/react-native  — Database, schema, connector types
@powersync/react          — Hooks: useQuery, usePowerSync, useStatus
@powersync/op-sqlite      — OPSqliteOpenFactory (SQLite adapter)
@op-engineering/op-sqlite — Native SQLite engine (peer dep)
```

Import from `@powersync/react-native` for: `PowerSyncDatabase`, `column`, `Schema`, `Table`, `AbstractPowerSyncDatabase`, `CrudEntry`, `PowerSyncBackendConnector`, `UpdateType`

Import from `@powersync/react` for: `useQuery`, `usePowerSync`, `useStatus`, `PowerSyncContext`

## Critical Conventions

- **IDs:** Client-generated UUID v4 via PowerSync's built-in `uuid()` SQLite function — PowerSync auto-creates the `id` column, never define it in schema
- **Timestamps:** Set `inserted_at`/`updated_at` locally (ISO 8601 string) for immediate UI; server overwrites on sync
- **Column types:** Only `column.text`, `column.integer`, `column.real` — no booleans (use integer 0/1), no dates (use text)
- **Offline-first:** All reads from local SQLite. Writes go to local queue, sync automatically. App works fully offline
- **Two-phase init:** `initializeDatabase()` on app start (creates local DB), `connectDatabase()` after auth (starts sync)

## Adding a New Synced Table

This is the most common cross-cutting task. All 7 steps must be done:

1. **PowerSync schema** — Add `Table` definition in `src/database/schema.ts`, add to `AppSchema`, export type
2. **Ecto schema** — Create schema + context module in `lib/nebbler_api/`
3. **Migration** — Create Ecto migration in `priv/repo/migrations/`
4. **Controller** — Add table case to `data_controller.ex`
5. **Sync rules** — Add `SELECT` to `nebbler-api/docker/powersync/sync_rules.yaml`
6. **Postgres publication** — Add table to publication: `ALTER PUBLICATION powersync ADD TABLE new_table;`
7. **Frontend hooks** — Create query + mutation hooks in `src/hooks/`, re-export from index

## Deep-Dive References

Read these only when working in the specific area:

| When you're...                                                      | Read                                            |
| ------------------------------------------------------------------- | ----------------------------------------------- |
| Defining or modifying table schemas, sync rules, or column mappings | `.claude/rules/powersync/schema-alignment.md`   |
| Modifying the connector, auth flow, or upload logic                 | `.claude/rules/powersync/connector-patterns.md` |
| Writing hooks, queries, mutations, or tests that use PowerSync      | `.claude/rules/powersync/hooks-and-queries.md`  |
| Debugging sync issues, connection failures, or error messages       | `.claude/rules/powersync/troubleshooting.md`    |
