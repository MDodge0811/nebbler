import { column, Schema, Table } from '@powersync/react-native';

/**
 * Test items table schema
 * This should match the backend Postgres table structure
 * and the PowerSync sync rules configuration
 */
const testItems = new Table({
  // PowerSync auto-includes 'id' column as primary key (TEXT type, UUID)
  name: column.text,
  description: column.text,
  completed: column.integer, // SQLite has no boolean, use 0/1
  created_at: column.text, // ISO 8601 timestamp string
  updated_at: column.text,
});

const users = new Table({
  first_name: column.text,
  last_name: column.text,
  email: column.text,
  username: column.text,
  display_name: column.text,
  inserted_at: column.text,
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
