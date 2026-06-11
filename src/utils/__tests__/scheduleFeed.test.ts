/**
 * Tests for buildFeedRows, summarizeDay, and calcStickyWindow — all pure utilities.
 * No PowerSync/React needed here.
 */

import { buildFeedRows, summarizeDay } from '@utils/scheduleFeed';
import type { FeedEvent } from '@utils/scheduleFeed';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEvent(overrides: Partial<FeedEvent> = {}): FeedEvent {
  return {
    id: 'evt-1',
    calendar_id: 'cal-1',
    created_by_user_id: 'user-creator',
    title: 'Test Event',
    description: null,
    start_time: '2026-06-10T14:00:00Z',
    end_time: '2026-06-10T15:00:00Z',
    show_as: 'busy',
    is_all_day: 0,
    rrule: null,
    duration_minutes: null,
    recurring_event_id: null,
    recurrence_id: null,
    exdates: null,
    deleted_at: null,
    inserted_at: '2026-06-01T00:00:00Z',
    updated_at: '2026-06-01T00:00:00Z',
    calendar_name: 'Personal',
    calendar_type: 'private',
    calendar_color: '#FF6B6B',
    calendar_default_view_mode: 'full',
    starred: false,
    attendees: [],
    ...overrides,
  };
}

const RANGE = { start: '2026-06-10', end: '2026-06-12' };
const TODAY = '2026-06-10';
// 2:30 PM on 2026-06-10 — in the middle of the day
const NOW = new Date('2026-06-10T14:30:00Z');

// ---------------------------------------------------------------------------
// buildFeedRows — day-header per day
// ---------------------------------------------------------------------------

describe('buildFeedRows — day headers', () => {
  it('emits one day-header per day in the range', () => {
    const { rows } = buildFeedRows({
      events: [],
      responsesByEvent: {},
      starredIds: new Set(),
      viewModeByCalendar: {},
      dateRange: RANGE,
      today: TODAY,
      now: NOW,
      starredOnly: false,
    });
    const headers = rows.filter((r) => r.kind === 'day-header');
    expect(headers).toHaveLength(3);
    expect(headers[0]).toMatchObject({ kind: 'day-header', date: '2026-06-10' });
    expect(headers[1]).toMatchObject({ kind: 'day-header', date: '2026-06-11' });
    expect(headers[2]).toMatchObject({ kind: 'day-header', date: '2026-06-12' });
  });

  it('emits a quiet-day for days with no events', () => {
    const { rows } = buildFeedRows({
      events: [],
      responsesByEvent: {},
      starredIds: new Set(),
      viewModeByCalendar: {},
      dateRange: RANGE,
      today: TODAY,
      now: NOW,
      starredOnly: false,
    });
    const quietDays = rows.filter((r) => r.kind === 'quiet-day');
    expect(quietDays).toHaveLength(3);
  });

  it('does NOT emit quiet-day rows when starredOnly is active', () => {
    const { rows } = buildFeedRows({
      events: [],
      responsesByEvent: {},
      starredIds: new Set(),
      viewModeByCalendar: {},
      dateRange: RANGE,
      today: TODAY,
      now: NOW,
      starredOnly: true,
    });
    // No headers and no quiet-days — all days are empty starred days
    expect(rows.filter((r) => r.kind === 'quiet-day')).toHaveLength(0);
    expect(rows.filter((r) => r.kind === 'day-header')).toHaveLength(0);
  });

  it('populates indexByDate with each date pointing at its day-header index', () => {
    const { rows, indexByDate } = buildFeedRows({
      events: [],
      responsesByEvent: {},
      starredIds: new Set(),
      viewModeByCalendar: {},
      dateRange: RANGE,
      today: TODAY,
      now: NOW,
      starredOnly: false,
    });
    for (const [date, idx] of indexByDate) {
      expect(rows[idx]).toMatchObject({ kind: 'day-header', date });
    }
    expect(indexByDate.size).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// buildFeedRows — all-day events
// ---------------------------------------------------------------------------

describe('buildFeedRows — all-day events', () => {
  it('pins all-day events after their day-header', () => {
    const event = makeEvent({
      id: 'ad-1',
      is_all_day: 1,
      start_time: '2026-06-10T00:00:00Z',
      end_time: '2026-06-11T00:00:00Z',
    });
    const { rows } = buildFeedRows({
      events: [event],
      responsesByEvent: {},
      starredIds: new Set(),
      viewModeByCalendar: {},
      dateRange: RANGE,
      today: TODAY,
      now: NOW,
      starredOnly: false,
    });
    const headerIdx = rows.findIndex((r) => r.kind === 'day-header' && r.date === '2026-06-10');
    expect(headerIdx).toBeGreaterThanOrEqual(0);
    expect(rows[headerIdx + 1]).toMatchObject({ kind: 'all-day', date: '2026-06-10' });
  });

  it('repeats a multi-day all-day event on every spanned day', () => {
    // spans 10 → 12 inclusive (end = 2026-06-13T00:00:00Z means it covers 10, 11, 12)
    const event = makeEvent({
      id: 'ad-multi',
      is_all_day: 1,
      start_time: '2026-06-10T00:00:00Z',
      end_time: '2026-06-13T00:00:00Z',
    });
    const { rows } = buildFeedRows({
      events: [event],
      responsesByEvent: {},
      starredIds: new Set(),
      viewModeByCalendar: {},
      dateRange: RANGE,
      today: TODAY,
      now: NOW,
      starredOnly: false,
    });
    const allDayRows = rows.filter((r) => r.kind === 'all-day' && r.event.id === 'ad-multi');
    expect(allDayRows).toHaveLength(3);
    expect(allDayRows.map((r) => r.date)).toEqual(['2026-06-10', '2026-06-11', '2026-06-12']);
  });
});

// ---------------------------------------------------------------------------
// buildFeedRows — busy events
// ---------------------------------------------------------------------------

describe('buildFeedRows — busy events (free_busy view_mode)', () => {
  it('marks event as busy when calendar_members view_mode is free_busy', () => {
    const event = makeEvent({
      id: 'busy-1',
      calendar_id: 'cal-busy',
      is_all_day: 0,
      start_time: '2026-06-10T09:00:00Z',
      end_time: '2026-06-10T10:00:00Z',
    });
    const { rows } = buildFeedRows({
      events: [event],
      responsesByEvent: {},
      starredIds: new Set(),
      viewModeByCalendar: { 'cal-busy': 'free_busy' },
      dateRange: RANGE,
      today: TODAY,
      now: NOW,
      starredOnly: false,
    });
    const busyRows = rows.filter((r) => r.kind === 'busy');
    expect(busyRows).toHaveLength(1);
    expect(busyRows[0]).toMatchObject({ kind: 'busy', date: '2026-06-10' });
  });

  it('marks event as busy when calendar default_view_mode is free_busy and no member override', () => {
    const event = makeEvent({
      id: 'busy-default',
      calendar_id: 'cal-d',
      is_all_day: 0,
      calendar_default_view_mode: 'free_busy',
      start_time: '2026-06-10T09:00:00Z',
      end_time: '2026-06-10T10:00:00Z',
    });
    const { rows } = buildFeedRows({
      events: [event],
      responsesByEvent: {},
      starredIds: new Set(),
      viewModeByCalendar: {}, // no member override
      dateRange: RANGE,
      today: TODAY,
      now: NOW,
      starredOnly: false,
    });
    const busyRows = rows.filter((r) => r.kind === 'busy');
    expect(busyRows).toHaveLength(1);
  });

  it('member view_mode overrides calendar default', () => {
    // member says 'full', default says 'free_busy' — should NOT be busy
    const event = makeEvent({
      id: 'override-full',
      calendar_id: 'cal-x',
      calendar_default_view_mode: 'free_busy',
      start_time: '2026-06-10T09:00:00Z',
      end_time: '2026-06-10T10:00:00Z',
    });
    const { rows } = buildFeedRows({
      events: [event],
      responsesByEvent: {},
      starredIds: new Set(),
      viewModeByCalendar: { 'cal-x': 'full' }, // member override wins
      dateRange: RANGE,
      today: TODAY,
      now: NOW,
      starredOnly: false,
    });
    const busyRows = rows.filter((r) => r.kind === 'busy');
    expect(busyRows).toHaveLength(0);
    expect(rows.filter((r) => r.kind === 'event')).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// buildFeedRows — now-line placement
// ---------------------------------------------------------------------------

describe('buildFeedRows — now-line', () => {
  it('inserts now-line only in today section', () => {
    const pastEvent = makeEvent({
      id: 'past',
      start_time: '2026-06-10T13:00:00Z',
      end_time: '2026-06-10T14:00:00Z',
    });
    const futureEvent = makeEvent({
      id: 'future',
      start_time: '2026-06-10T15:00:00Z',
      end_time: '2026-06-10T16:00:00Z',
    });
    const tomorrowEvent = makeEvent({
      id: 'tomorrow',
      start_time: '2026-06-11T13:00:00Z',
      end_time: '2026-06-11T14:00:00Z',
    });
    const { rows } = buildFeedRows({
      events: [pastEvent, futureEvent, tomorrowEvent],
      responsesByEvent: {},
      starredIds: new Set(),
      viewModeByCalendar: {},
      dateRange: RANGE,
      today: TODAY,
      now: NOW, // 14:30 — between past (ends 14:00) and future (starts 15:00)
      starredOnly: false,
    });

    const nowLines = rows.filter((r) => r.kind === 'now-line');
    expect(nowLines).toHaveLength(1);
    expect(nowLines[0]).toMatchObject({ kind: 'now-line', date: TODAY });
    // now-line carries a label
    expect((nowLines[0] as { label: string }).label).toMatch(/^NOW · /);

    // now-line must be between past and future event rows in the today group
    const todayGroup = rows.filter((r) => r.date === TODAY);
    const nowLineIdx = todayGroup.findIndex((r) => r.kind === 'now-line');
    const pastIdx = todayGroup.findIndex((r) => r.kind === 'event' && r.event.id === 'past');
    const futureIdx = todayGroup.findIndex((r) => r.kind === 'event' && r.event.id === 'future');
    expect(pastIdx).toBeLessThan(nowLineIdx);
    expect(nowLineIdx).toBeLessThan(futureIdx);
  });

  it('does not emit now-line for non-today dates', () => {
    const tomorrowEvent = makeEvent({
      id: 'tmrw',
      start_time: '2026-06-11T10:00:00Z',
      end_time: '2026-06-11T11:00:00Z',
    });
    const { rows } = buildFeedRows({
      events: [tomorrowEvent],
      responsesByEvent: {},
      starredIds: new Set(),
      viewModeByCalendar: {},
      dateRange: { start: '2026-06-11', end: '2026-06-11' },
      today: TODAY,
      now: NOW,
      starredOnly: false,
    });
    expect(rows.filter((r) => r.kind === 'now-line')).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// buildFeedRows — compact mode (≥5 timed events)
// ---------------------------------------------------------------------------

describe('buildFeedRows — compact threshold', () => {
  function makeTimedEvents(count: number, date: string): FeedEvent[] {
    return Array.from({ length: count }, (_, i) =>
      makeEvent({
        id: `evt-${i}`,
        start_time: `${date}T${String(9 + i).padStart(2, '0')}:00:00Z`,
        end_time: `${date}T${String(10 + i).padStart(2, '0')}:00:00Z`,
        is_all_day: 0,
      })
    );
  }

  it('uses mode full when < 5 timed events', () => {
    const events = makeTimedEvents(4, '2026-06-11');
    const { rows } = buildFeedRows({
      events,
      responsesByEvent: {},
      starredIds: new Set(),
      viewModeByCalendar: {},
      dateRange: { start: '2026-06-11', end: '2026-06-11' },
      today: TODAY,
      now: NOW,
      starredOnly: false,
    });
    const eventRows = rows.filter((r) => r.kind === 'event');
    expect(eventRows.every((r) => r.mode === 'full')).toBe(true);
  });

  it('uses mode compact when ≥5 timed events', () => {
    const events = makeTimedEvents(5, '2026-06-11');
    const { rows } = buildFeedRows({
      events,
      responsesByEvent: {},
      starredIds: new Set(),
      viewModeByCalendar: {},
      dateRange: { start: '2026-06-11', end: '2026-06-11' },
      today: TODAY,
      now: NOW,
      starredOnly: false,
    });
    const eventRows = rows.filter((r) => r.kind === 'event');
    expect(eventRows.every((r) => r.mode === 'compact')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// buildFeedRows — star filter
// ---------------------------------------------------------------------------

describe('buildFeedRows — starredOnly filter', () => {
  it('only includes starred events when starredOnly is true', () => {
    const starred = makeEvent({
      id: 'star-1',
      start_time: '2026-06-11T10:00:00Z',
      end_time: '2026-06-11T11:00:00Z',
    });
    const unstarred = makeEvent({
      id: 'nostar-1',
      start_time: '2026-06-11T12:00:00Z',
      end_time: '2026-06-11T13:00:00Z',
    });
    const { rows } = buildFeedRows({
      events: [starred, unstarred],
      responsesByEvent: {},
      starredIds: new Set(['star-1']),
      viewModeByCalendar: {},
      dateRange: { start: '2026-06-11', end: '2026-06-11' },
      today: TODAY,
      now: NOW,
      starredOnly: true,
    });
    const eventRows = rows.filter(
      (r) => r.kind === 'event' || r.kind === 'busy' || r.kind === 'all-day'
    );
    expect(eventRows).toHaveLength(1);
    expect(eventRows[0]).toMatchObject({ kind: 'event', event: { id: 'star-1' } });
  });

  it('collapses days with no starred events (no header, no quiet-day)', () => {
    const starredJun11 = makeEvent({
      id: 'star-11',
      start_time: '2026-06-11T10:00:00Z',
      end_time: '2026-06-11T11:00:00Z',
    });
    // Jun 10 and Jun 12 have no starred events
    const { rows } = buildFeedRows({
      events: [starredJun11],
      responsesByEvent: {},
      starredIds: new Set(['star-11']),
      viewModeByCalendar: {},
      dateRange: RANGE,
      today: TODAY,
      now: NOW,
      starredOnly: true,
    });
    // Only Jun 11 should have rows
    const headerDates = rows.filter((r) => r.kind === 'day-header').map((r) => r.date);
    expect(headerDates).toEqual(['2026-06-11']);
    expect(rows.filter((r) => r.kind === 'quiet-day')).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// buildFeedRows — attendees (AttendeeChip)
// ---------------------------------------------------------------------------

describe('buildFeedRows — attendee chips', () => {
  it('maps event_responses to AttendeeChip and filters not_going', () => {
    const event = makeEvent({
      id: 'evt-chips',
      start_time: '2026-06-11T10:00:00Z',
      end_time: '2026-06-11T11:00:00Z',
    });
    const responses = [
      {
        event_id: 'evt-chips',
        user_id: 'u-1',
        status: 'going',
        first_name: 'Alice',
        last_name: 'Smith',
        avatar_color: '#00DB74',
      },
      {
        event_id: 'evt-chips',
        user_id: 'u-2',
        status: 'pending',
        first_name: 'Bob',
        last_name: null,
        avatar_color: null,
      },
      {
        event_id: 'evt-chips',
        user_id: 'u-3',
        status: 'not_going',
        first_name: 'Carol',
        last_name: 'Jones',
        avatar_color: '#A855F7',
      },
      {
        event_id: 'evt-chips',
        user_id: 'u-4',
        status: 'maybe',
        first_name: 'Dana',
        last_name: 'Lee',
        avatar_color: '#EC4899',
      },
    ];
    const { rows } = buildFeedRows({
      events: [event],
      responsesByEvent: { 'evt-chips': responses },
      starredIds: new Set(),
      viewModeByCalendar: {},
      dateRange: { start: '2026-06-11', end: '2026-06-11' },
      today: TODAY,
      now: NOW,
      starredOnly: false,
    });
    const eventRow = rows.find((r) => r.kind === 'event');
    expect(eventRow).toBeDefined();
    // Extract chips via toHaveProperty so TypeScript narrowing isn't needed for expects
    expect(eventRow).toHaveProperty('event.attendees');
    // Cast is safe: we just asserted kind === 'event' via toMatchObject
    const chips = (eventRow as Extract<(typeof rows)[number], { kind: 'event' }>).event.attendees;
    // not_going filtered out → 3 chips remain (going, pending, maybe→pending)
    expect(chips).toHaveLength(3);
    expect(chips.find((c) => c.userId === 'u-1')?.rsvp).toBe('going');
    expect(chips.find((c) => c.userId === 'u-2')?.rsvp).toBe('pending');
    expect(chips.find((c) => c.userId === 'u-4')?.rsvp).toBe('pending'); // maybe → pending
    expect(chips.find((c) => c.userId === 'u-3')).toBeUndefined(); // not_going filtered
  });
});

// ---------------------------------------------------------------------------
// summarizeDay
// ---------------------------------------------------------------------------

/**
 * Build a local ISO string for a specific local date+time on 2026-06-10,
 * regardless of the test runner timezone. This lets us write deterministic
 * tests for the 09:00–18:00 local window logic.
 */
function localIso(hour: number, minute = 0): string {
  const d = new Date(2026, 5, 10, hour, minute, 0); // month is 0-indexed: June = 5
  return d.toISOString();
}

describe('summarizeDay', () => {
  it('returns empty label for empty day', () => {
    const shape = summarizeDay([]);
    expect(shape.countLabel).toBe('Nothing scheduled yet');
  });

  it('returns N events label', () => {
    const events = [makeEvent(), makeEvent({ id: 'e2' })];
    const shape = summarizeDay(events);
    expect(shape.countLabel).toBe('2 events');
  });

  it('returns light day closer when ≤3 events and no overlap with 9–18 window', () => {
    // Event at 07:00–08:00 local is before the 09:00–18:00 window
    const events = [
      makeEvent({
        id: 'early',
        start_time: localIso(7),
        end_time: localIso(8),
      }),
    ];
    const shape = summarizeDay(events);
    expect(shape.busyLabel).toBeUndefined();
    expect(shape.closerLabel).toBe('light day');
  });

  it('detects largest contiguous busy block 9:00–18:00', () => {
    // Two adjacent events at 11:00–13:00 and 13:00–14:30 local → merged block 11–14:30
    const events = [
      makeEvent({ id: 'b1', start_time: localIso(11), end_time: localIso(13) }),
      makeEvent({ id: 'b2', start_time: localIso(13), end_time: localIso(14, 30) }),
    ];
    const shape = summarizeDay(events);
    expect(shape.busyLabel).toBeDefined();
    // Label starts with "busy 11" (11am)
    expect(shape.busyLabel).toMatch(/^busy 11/);
  });

  it('detects last event after 17:00 as closer', () => {
    const events = [
      makeEvent({
        id: 'e1',
        title: 'Dinner with friends',
        start_time: localIso(17, 30),
        end_time: localIso(19),
      }),
    ];
    const shape = summarizeDay(events);
    expect(shape.closerLabel).toMatch(/dinner/i);
    // 17:30 local → "5:30" in the label
    expect(shape.closerLabel).toMatch(/5:30/);
  });

  it('omits busy block if no events overlap 9:00–18:00', () => {
    // Event at 20:00–21:00 local is after the window
    const events = [makeEvent({ id: 'e1', start_time: localIso(20), end_time: localIso(21) })];
    const shape = summarizeDay(events);
    expect(shape.busyLabel).toBeUndefined();
  });
});
