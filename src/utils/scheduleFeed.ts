/**
 * scheduleFeed.ts — Pure data utilities for the schedule feed.
 *
 * This module exports:
 *  - FeedRow / FeedEvent / AttendeeChip / DayShape types
 *  - buildFeedRows — converts raw query results into a flat FeedRow[]
 *  - summarizeDay  — produces DayShape from a day's events
 *
 * IMPORTANT: No React, no PowerSync, no imports from hook/component layers.
 * The hook (useScheduleFeed) is the only caller of these functions.
 */

import type { Event } from '@database/schema';
import { getAvatarColor, getInitials } from '@utils/avatarColor';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * An event row joined with calendar metadata — the raw query result, before
 * enrichment. `useQuery` returns these; `starred`/`attendees` are NOT selected
 * by the SQL and only exist on the enriched `FeedEvent`.
 */
export interface RawFeedEvent extends Event {
  calendar_name: string;
  calendar_type: string;
  /** Hex color from calendars.color */
  calendar_color: string | null;
  /** Effective default view mode from calendars.default_view_mode */
  calendar_default_view_mode: string | null;
}

/** A RawFeedEvent enriched with the current user's star + attendee chips. */
export interface FeedEvent extends RawFeedEvent {
  /** True when the current user has starred this event */
  starred: boolean;
  /** Attendee chips derived from event_responses + users */
  attendees: AttendeeChip[];
}

/** A single attendee chip for the event card. */
export interface AttendeeChip {
  userId: string;
  initials: string;
  color: string;
  /** going = confirmed; pending = maybe or no response yet */
  rsvp: 'going' | 'pending';
}

/** Structured day summary for the day-header label. */
export interface DayShape {
  /** e.g. "4 events" or "Nothing scheduled yet" */
  countLabel: string;
  /** e.g. "busy 12–1:30" — largest contiguous block within 09:00–18:00 */
  busyLabel?: string;
  /** e.g. "ends with dinner at 7" | "light day" */
  closerLabel?: string;
}

// ---------------------------------------------------------------------------
// FeedRow discriminated union
// ---------------------------------------------------------------------------

export type FeedRow =
  | { kind: 'day-header'; date: string; summary: DayShape }
  | { kind: 'all-day'; date: string; event: FeedEvent }
  | { kind: 'now-line'; date: string; label: string }
  | { kind: 'event'; date: string; event: FeedEvent; mode: 'full' | 'compact' }
  | { kind: 'busy'; date: string; event: FeedEvent }
  | { kind: 'quiet-day'; date: string };

// ---------------------------------------------------------------------------
// AttendeeChip response input shape
// ---------------------------------------------------------------------------

/** Raw row returned by the event_responses JOIN users query. */
export interface ResponseRow {
  event_id: string;
  user_id: string;
  status: string; // 'going' | 'pending' | 'maybe' | 'not_going'
  first_name: string | null;
  last_name: string | null;
  avatar_color: string | null;
}

// ---------------------------------------------------------------------------
// buildFeedRows inputs / outputs
// ---------------------------------------------------------------------------

export interface DateRange {
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
}

export interface BuildFeedRowsInput {
  events: RawFeedEvent[];
  /** Keyed by event_id; value is array of response rows for that event */
  responsesByEvent: Record<string, ResponseRow[]>;
  /** Set of event_ids the current user has starred */
  starredIds: Set<string>;
  /**
   * Resolved view mode per calendar_id for the current user.
   * Value is `calendar_members.view_mode` if present, otherwise
   * `calendars.default_view_mode`. Absence means 'full'.
   */
  viewModeByCalendar: Record<string, string | null>;
  dateRange: DateRange;
  today: string; // YYYY-MM-DD
  /** Current moment — used for now-line placement. Pass as argument, NEVER call Date.now() inside. */
  now: Date;
  starredOnly: boolean;
}

export interface BuildFeedRowsOutput {
  rows: FeedRow[];
  /** date (YYYY-MM-DD) → index of its day-header in rows */
  indexByDate: Map<string, number>;
}

// ---------------------------------------------------------------------------
// Internal helpers — date math
// ---------------------------------------------------------------------------

const COMPACT_THRESHOLD = 5;

const PAD2 = (n: number) => String(n).padStart(2, '0');

/** Parses "YYYY-MM-DD" into a local noon Date (avoids DST boundary shifts). */
function parseDateLocal(dateStr: string): Date {
  return new Date(dateStr + 'T12:00:00');
}

/** Formats a local Date as YYYY-MM-DD. */
function toDateString(d: Date): string {
  return `${d.getFullYear()}-${PAD2(d.getMonth() + 1)}-${PAD2(d.getDate())}`;
}

/** Generates all YYYY-MM-DD strings in [start, end] inclusive. */
function expandDateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const current = parseDateLocal(start);
  const endDate = parseDateLocal(end);
  while (current <= endDate) {
    dates.push(toDateString(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

/** Extracts YYYY-MM-DD from a UTC ISO string by parsing as local Date. */
function localDateKey(isoUtc: string): string {
  const d = new Date(isoUtc);
  return `${d.getFullYear()}-${PAD2(d.getMonth() + 1)}-${PAD2(d.getDate())}`;
}

/**
 * Returns all YYYY-MM-DD strings that an all-day event spans, clipped to [rangeStart, rangeEnd].
 * Uses UTC date math because all-day events store midnight-UTC boundaries.
 */
export function allDaySpannedDates(
  startUtc: string,
  endUtc: string,
  rangeStart: string,
  rangeEnd: string
): string[] {
  const start = new Date(startUtc);
  const lastDay = new Date(endUtc);
  // All-day end is exclusive midnight; last spanned date = end - 1 day.
  lastDay.setUTCDate(lastDay.getUTCDate() - 1);

  const toUtcDateStr = (d: Date) =>
    `${d.getUTCFullYear()}-${PAD2(d.getUTCMonth() + 1)}-${PAD2(d.getUTCDate())}`;

  const evStart = toUtcDateStr(start);
  const evEnd = toUtcDateStr(lastDay);
  const clampedStart = evStart < rangeStart ? rangeStart : evStart;
  const clampedEnd = evEnd > rangeEnd ? rangeEnd : evEnd;
  if (clampedStart > clampedEnd) return [];
  return expandDateRange(clampedStart, clampedEnd);
}

// ---------------------------------------------------------------------------
// Internal helpers — event classification
// ---------------------------------------------------------------------------

/** Returns true when the resolved view_mode for this event is 'free_busy'. */
function isBusyEvent(event: FeedEvent, viewModeByCalendar: Record<string, string | null>): boolean {
  const calId = event.calendar_id;
  if (calId !== null) {
    const memberOverride = viewModeByCalendar[calId];
    if (memberOverride !== undefined) return memberOverride === 'free_busy';
  }
  return event.calendar_default_view_mode === 'free_busy';
}

/** Maps raw response rows to AttendeeChip[], filtering out 'not_going'. */
function buildAttendeeChips(responses: ResponseRow[]): AttendeeChip[] {
  const chips: AttendeeChip[] = [];
  for (const r of responses) {
    if (r.status === 'not_going') continue;
    const rsvp: 'going' | 'pending' = r.status === 'going' ? 'going' : 'pending';
    chips.push({
      userId: r.user_id,
      initials: getInitials(r.first_name, r.last_name, r.user_id),
      color: r.avatar_color ?? getAvatarColor(r.user_id),
      rsvp,
    });
  }
  return chips;
}

/** Enrich an event with attendees and starred flag. */
function enrichEvent(
  e: RawFeedEvent,
  responsesByEvent: Record<string, ResponseRow[]>,
  starredIds: Set<string>
): FeedEvent {
  const responses = responsesByEvent[e.id] ?? [];
  return { ...e, starred: starredIds.has(e.id), attendees: buildAttendeeChips(responses) };
}

// ---------------------------------------------------------------------------
// Internal helpers — row emission
// ---------------------------------------------------------------------------

interface DayBuckets {
  timedByDate: Map<string, FeedEvent[]>;
  allDayByDate: Map<string, FeedEvent[]>;
}

/** Buckets enriched events into timed and all-day maps keyed by YYYY-MM-DD. */
function bucketEvents(enriched: FeedEvent[], dateRange: DateRange): DayBuckets {
  const timedByDate = new Map<string, FeedEvent[]>();
  const allDayByDate = new Map<string, FeedEvent[]>();

  for (const event of enriched) {
    if (!event.start_time) continue;
    if (event.is_all_day === 1) {
      const spanned = allDaySpannedDates(
        event.start_time,
        event.end_time ?? event.start_time,
        dateRange.start,
        dateRange.end
      );
      for (const d of spanned) {
        const arr = allDayByDate.get(d) ?? [];
        arr.push(event);
        allDayByDate.set(d, arr);
      }
    } else {
      const dateKey = localDateKey(event.start_time);
      if (dateKey >= dateRange.start && dateKey <= dateRange.end) {
        const arr = timedByDate.get(dateKey) ?? [];
        arr.push(event);
        timedByDate.set(dateKey, arr);
      }
    }
  }
  return { timedByDate, allDayByDate };
}

/** Emits timed event rows for a single day, including now-line for today. */
function emitTimedRows(
  rows: FeedRow[],
  timedEvents: FeedEvent[],
  date: string,
  isToday: boolean,
  now: Date,
  mode: 'full' | 'compact',
  busyById: Map<string, boolean>,
  starredOnly: boolean
): void {
  let nowLineEmitted = false;

  for (const e of timedEvents) {
    if (starredOnly && !e.starred) continue;

    if (isToday && !nowLineEmitted && e.start_time) {
      const eventStart = new Date(e.start_time);
      if (eventStart > now) {
        rows.push({ kind: 'now-line', date, label: formatNowLabel(now) });
        nowLineEmitted = true;
      }
    }

    if (busyById.get(e.id)) {
      rows.push({ kind: 'busy', date, event: e });
    } else {
      rows.push({ kind: 'event', date, event: e, mode });
    }
  }

  if (isToday && !nowLineEmitted) {
    rows.push({ kind: 'now-line', date, label: formatNowLabel(now) });
  }
}

/** Returns true if the day should be included when starredOnly is active. */
function dayHasStarred(timedEvents: FeedEvent[], allDayEvents: FeedEvent[]): boolean {
  return timedEvents.some((e) => e.starred) || allDayEvents.some((e) => e.starred);
}

// ---------------------------------------------------------------------------
// buildFeedRows
// ---------------------------------------------------------------------------

/**
 * Converts raw query data into a flat FeedRow[] suitable for a FlashList or
 * SectionList-replacement. Pure function — no side effects, no Date.now().
 *
 * Output contract:
 *   rows[indexByDate.get(date)] is always a day-header row for that date
 *   (when !starredOnly or when that date has starred events).
 */
export function buildFeedRows({
  events,
  responsesByEvent,
  starredIds,
  viewModeByCalendar,
  dateRange,
  today,
  now,
  starredOnly,
}: BuildFeedRowsInput): BuildFeedRowsOutput {
  const allDates = expandDateRange(dateRange.start, dateRange.end);
  const rows: FeedRow[] = [];
  const indexByDate = new Map<string, number>();

  const enriched = events.map((e) => enrichEvent(e, responsesByEvent, starredIds));
  const { timedByDate, allDayByDate } = bucketEvents(enriched, dateRange);

  for (const date of allDates) {
    const timedEvents = timedByDate.get(date) ?? [];
    const allDayEvents = allDayByDate.get(date) ?? [];

    if (starredOnly && !dayHasStarred(timedEvents, allDayEvents)) continue;

    // Compute busy once per timed event and reuse for both the compact-mode
    // count and the row emission below.
    const busyById = new Map(timedEvents.map((e) => [e.id, isBusyEvent(e, viewModeByCalendar)]));
    const nonBusyCount = timedEvents.reduce((n, e) => (busyById.get(e.id) ? n : n + 1), 0);
    const mode: 'full' | 'compact' = nonBusyCount >= COMPACT_THRESHOLD ? 'compact' : 'full';

    const summary = summarizeDay([...allDayEvents, ...timedEvents]);
    indexByDate.set(date, rows.length);
    rows.push({ kind: 'day-header', date, summary });

    for (const e of allDayEvents) {
      if (starredOnly && !e.starred) continue;
      rows.push({ kind: 'all-day', date, event: e });
    }

    emitTimedRows(rows, timedEvents, date, date === today, now, mode, busyById, starredOnly);

    if (timedEvents.length + allDayEvents.length === 0) {
      rows.push({ kind: 'quiet-day', date });
    }
  }

  return { rows, indexByDate };
}

// ---------------------------------------------------------------------------
// summarizeDay helpers
// ---------------------------------------------------------------------------

type Interval = { s: number; e: number };

/** Clips events to [09:00, 18:00] local, merges overlaps, returns longest merged interval. */
function longestBusyBlock(timedEvents: FeedEvent[]): Interval | undefined {
  if (timedEvents.length === 0) return undefined;

  const firstStart = timedEvents[0]?.start_time;
  if (!firstStart) return undefined;

  const ref = new Date(firstStart);
  const y = ref.getFullYear();
  const mo = ref.getMonth();
  const d = ref.getDate();
  const winS = new Date(y, mo, d, 9, 0, 0).getTime();
  const winE = new Date(y, mo, d, 18, 0, 0).getTime();

  const intervals: Interval[] = [];
  for (const ev of timedEvents) {
    if (!ev.start_time || !ev.end_time) continue;
    const s = Math.max(new Date(ev.start_time).getTime(), winS);
    const e = Math.min(new Date(ev.end_time).getTime(), winE);
    if (s < e) intervals.push({ s, e });
  }
  if (intervals.length === 0) return undefined;

  intervals.sort((a, b) => a.s - b.s);
  return mergeAndPickLongest(intervals);
}

function mergeAndPickLongest(intervals: Interval[]): Interval | undefined {
  const merged: Interval[] = [];
  for (const iv of intervals) {
    const last = merged[merged.length - 1];
    if (last && iv.s <= last.e) {
      last.e = Math.max(last.e, iv.e);
    } else {
      merged.push({ ...iv });
    }
  }

  let longest: Interval | undefined;
  let longestMs = 0;
  for (const iv of merged) {
    const ms = iv.e - iv.s;
    if (ms > longestMs) {
      longestMs = ms;
      longest = iv;
    }
  }
  return longest;
}

/** Formats local hours/minutes into "h:mm" with no leading zero. */
function fmtLocalTime(d: Date): string {
  const h = d.getHours();
  const m = d.getMinutes();
  if (m === 0) return String(h % 12 || 12);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')}`;
}

/** Formats a Date as the now-line label: "NOW · h:mm". */
export function formatNowLabel(date: Date): string {
  return `NOW · ${fmtLocalTime(date)}`;
}

/** Returns the last event starting at or after 17:00 local, or undefined. */
function findCloserEvent(timedEvents: FeedEvent[]): FeedEvent | undefined {
  const late = timedEvents.filter((e) => e.start_time && new Date(e.start_time).getHours() >= 17);
  if (late.length === 0) return undefined;
  return late.reduce((latest, e) => {
    const tE = e.start_time ? new Date(e.start_time).getTime() : 0;
    const tL = latest.start_time ? new Date(latest.start_time).getTime() : 0;
    return tE > tL ? e : latest;
  });
}

// ---------------------------------------------------------------------------
// summarizeDay
// ---------------------------------------------------------------------------

/** Derives the "closer label" — a short end-of-day tagline or 'light day'. */
function closerLabelFor(
  timedEvents: FeedEvent[],
  busyLabel: string | undefined,
  totalCount: number
): string | undefined {
  const closerEv = findCloserEvent(timedEvents);
  if (closerEv?.start_time && closerEv.title) {
    const firstWord = closerEv.title.split(' ')[0]?.toLowerCase() ?? closerEv.title.toLowerCase();
    return `ends with ${firstWord} at ${fmtLocalTime(new Date(closerEv.start_time))}`;
  }
  if (!busyLabel && totalCount <= 3) return 'light day';
  return undefined;
}

/**
 * Produces a structured DayShape from a day's events.
 * Pure — no Date.now() inside; pass events in local time.
 */
export function summarizeDay(events: FeedEvent[]): DayShape {
  if (events.length === 0) return { countLabel: 'Nothing scheduled yet' };

  const countLabel = events.length === 1 ? '1 event' : `${events.length} events`;
  const timedEvents = events.filter((e) => e.is_all_day !== 1 && e.start_time && e.end_time);

  const block = longestBusyBlock(timedEvents);
  const busyLabel = block
    ? `busy ${fmtLocalTime(new Date(block.s))}–${fmtLocalTime(new Date(block.e))}`
    : undefined;

  const closerLabel = closerLabelFor(timedEvents, busyLabel, events.length);

  return {
    countLabel,
    ...(busyLabel !== undefined && { busyLabel }),
    ...(closerLabel !== undefined && { closerLabel }),
  };
}
