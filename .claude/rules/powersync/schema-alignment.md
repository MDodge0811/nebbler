---
paths:
  - 'src/database/schema.ts'
  - '**/sync_rules.yaml'
  - '**/migrations/**'
---

# PowerSync Schema Alignment

Three schemas must stay in sync: **PowerSync (local SQLite)**, **Ecto (backend)**, and **Postgres (source DB)**. A mismatch causes silent data loss or upload failures.

Docs: [PowerSync Schema Reference](https://docs.powersync.com/client-sdks/reference/react-native-and-expo)

## PowerSync Table Definition

```typescript
import { column, Schema, Table } from '@powersync/react-native';

const myTable = new Table(
  {
    // id column is auto-created by PowerSync — NEVER define it manually
    name: column.text,
    count: column.integer,
    score: column.real,
    inserted_at: column.text,
    updated_at: column.text,
  },
  { indexes: { name_idx: ['name'] } } // optional indexes
);

export const AppSchema = new Schema({ my_table: myTable });
export type Database = (typeof AppSchema)['types'];
export type MyTable = Database['my_table'];
```

**Rules:**

- Only three column types: `column.text`, `column.integer`, `column.real`
- No booleans — use `column.integer` with 0/1
- No dates — use `column.text` with ISO 8601 strings
- `id` is always TEXT (UUID), auto-included by PowerSync — do not define it
- Table name in `AppSchema` must match the Postgres table name and sync rule query
- Export both the `Database` type and individual table types

## Column Type Mapping

| PowerSync        | SQLite  | Postgres                                 | TypeScript |
| ---------------- | ------- | ---------------------------------------- | ---------- |
| `column.text`    | TEXT    | `text`, `varchar`, `uuid`, `timestamptz` | `string`   |
| `column.integer` | INTEGER | `integer`, `boolean`                     | `number`   |
| `column.real`    | REAL    | `real`, `float`, `numeric`               | `number`   |
| _(auto)_ `id`    | TEXT    | `uuid PRIMARY KEY`                       | `string`   |

## Three-Way Alignment Example

**PowerSync** (`src/database/schema.ts`):

```typescript
const events = new Table({
  calendar_id: column.text,
  title: column.text,
  start_time: column.text, // timestamptz → text
  is_recurring: column.integer, // boolean → integer 0/1
  deleted_at: column.text,
  inserted_at: column.text,
  updated_at: column.text,
});
```

**Ecto** (`lib/nebbler_api/events/event.ex`):

```elixir
schema "events" do
  field :calendar_id, Ecto.UUID
  field :title, :string
  field :start_time, :utc_datetime
  field :is_recurring, :boolean, default: false
  field :deleted_at, :utc_datetime
  timestamps()  # creates inserted_at + updated_at
end
```

**Postgres migration**:

```elixir
create table(:events, primary_key: false) do
  add :id, :binary_id, primary_key: true
  add :calendar_id, references(:calendars, type: :binary_id)
  add :title, :text, null: false
  add :start_time, :utc_datetime, null: false
  add :is_recurring, :boolean, default: false
  add :deleted_at, :utc_datetime
  timestamps()
end
```

## Sync Rules

Location: `nebbler-api/docker/powersync/sync_rules.yaml`

Docs: [Sync Rules Reference](https://docs.powersync.com/usage/sync-rules)

```yaml
bucket_definitions:
  global:
    data:
      - SELECT * FROM test_items
      - >
        SELECT id, first_name, last_name, email, display_name,
               inserted_at, updated_at
        FROM users WHERE deleted_at IS NULL
```

**Rules:**

- Column names in SELECT must match the PowerSync `Table` definition exactly
- Use explicit column lists (not `SELECT *`) when excluding sensitive fields (e.g., `password_hash`)
- `WHERE deleted_at IS NULL` for soft-delete filtering — prevents deleted records from syncing
- For user-scoped data: `WHERE user_id = token_parameters.user_id`
- After changing sync rules: restart the PowerSync container (`docker compose restart powersync`)

## Postgres Publication

Every synced table must be in the PowerSync publication:

```sql
-- Check current publication tables
SELECT * FROM pg_publication_tables WHERE pubname = 'powersync';

-- Add a new table to the publication
ALTER PUBLICATION powersync ADD TABLE new_table;
```

If a table is not in the publication, PowerSync will not detect changes via CDC (logical replication).

## Common Mistakes

- Defining `id` in the PowerSync Table (it's auto-created — defining it causes a duplicate column)
- Using `column.integer` for a UUID foreign key (must be `column.text`)
- Timestamp column name mismatch between Ecto (`inserted_at`) and Postgres (ensure Ecto `timestamps()` is not remapped)
- Forgetting to add a new table to the Postgres publication
- Using `SELECT *` in sync rules when the table has columns that should not sync (e.g., `password_hash`)
