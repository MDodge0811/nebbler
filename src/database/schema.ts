import { column, Schema, Table } from '@powersync/react-native';

/**
 * PowerSync Schema
 *
 * These table definitions must match the backend Postgres structure and the
 * sync rules in docker/powersync/sync_rules.yaml.
 *
 * Timestamp columns (inserted_at, updated_at):
 * - Defined here so synced server values are stored locally for sorting/display.
 * - Frontend mutations set local timestamps on create for immediate UI use.
 * - These are NOT sent to the backend for persistence — Ecto manages timestamps
 *   server-side. The local values get overwritten when the server round-trip
 *   completes and PowerSync syncs the authoritative timestamps back.
 */

const testItems = new Table({
  // PowerSync auto-includes 'id' column as primary key (TEXT type, UUID)
  name: column.text,
  description: column.text,
  completed: column.integer, // SQLite has no boolean, use 0/1
  inserted_at: column.text, // Set locally, overwritten by server on sync
  updated_at: column.text,
});

const users = new Table({
  first_name: column.text,
  last_name: column.text,
  email: column.text,
  display_name: column.text,
  // password_hash and deleted_at are excluded — never synced to clients
  inserted_at: column.text, // Set locally, overwritten by server on sync
  updated_at: column.text,
});

/**
 * AppSchema defines all synced tables
 * Table names must match the sync rules defined in PowerSync dashboard
 */
export const AppSchema = new Schema({
  test_items: testItems,
  users: users,
});

/**
 * Type export for the schema
 * Used for type-safe database operations
 */
export type Database = (typeof AppSchema)['types'];
export type TestItem = Database['test_items'];
export type User = Database['users'];
