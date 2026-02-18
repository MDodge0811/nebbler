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
  primary_calendar_group_id: column.text,
  // password_hash and deleted_at are excluded — never synced to clients
  inserted_at: column.text, // Set locally, overwritten by server on sync
  updated_at: column.text,
});

const roles = new Table({
  name: column.text,
  level: column.integer,
});

const calendars = new Table({
  owner_id: column.text,
  type: column.text,
  name: column.text,
  description: column.text,
  rsvp_enabled: column.integer, // SQLite boolean 0/1
  discoverable: column.integer, // SQLite boolean 0/1
  default_view_mode: column.text,
  household_sharing: column.integer, // SQLite boolean 0/1
  deleted_at: column.text,
  inserted_at: column.text,
  updated_at: column.text,
});

const calendarMembers = new Table({
  user_id: column.text,
  calendar_id: column.text,
  role_id: column.text,
  view_mode: column.text,
  can_delete_events: column.integer, // SQLite boolean 0/1
  deleted_at: column.text,
  inserted_at: column.text,
  updated_at: column.text,
});

const calendarGroups = new Table({
  owner_id: column.text,
  type: column.text,
  name: column.text,
  deleted_at: column.text,
  inserted_at: column.text,
  updated_at: column.text,
});

const calendarGroupUsers = new Table({
  calendar_group_id: column.text,
  user_id: column.text,
  role: column.text,
  deleted_at: column.text,
  inserted_at: column.text,
  updated_at: column.text,
});

const calendarGroupMemberships = new Table({
  calendar_group_id: column.text,
  calendar_id: column.text,
  view_mode: column.text,
  deleted_at: column.text,
  inserted_at: column.text,
  updated_at: column.text,
});

const events = new Table({
  calendar_id: column.text,
  created_by_user_id: column.text,
  title: column.text,
  description: column.text,
  start_time: column.text, // ISO 8601 datetime string (UTC)
  end_time: column.text, // ISO 8601 datetime string (UTC)
  is_recurring: column.integer, // SQLite boolean 0/1 — always 0 for MVP
  deleted_at: column.text,
  inserted_at: column.text, // Set locally, overwritten by server on sync
  updated_at: column.text,
});

const eventResponses = new Table({
  event_id: column.text,
  user_id: column.text,
  status: column.text,
  responded_at: column.text,
  deleted_at: column.text,
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
  roles: roles,
  calendars: calendars,
  calendar_members: calendarMembers,
  calendar_groups: calendarGroups,
  calendar_group_users: calendarGroupUsers,
  calendar_group_memberships: calendarGroupMemberships,
  events: events,
  event_responses: eventResponses,
});

/**
 * Type export for the schema
 * Used for type-safe database operations
 */
export type Database = (typeof AppSchema)['types'];
export type TestItem = Database['test_items'];
export type User = Database['users'];
export type Role = Database['roles'];
export type Calendar = Database['calendars'];
export type CalendarMember = Database['calendar_members'];
export type CalendarGroup = Database['calendar_groups'];
export type CalendarGroupUser = Database['calendar_group_users'];
export type CalendarGroupMembership = Database['calendar_group_memberships'];
export type Event = Database['events'];
export type EventResponse = Database['event_responses'];
