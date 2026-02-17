---
paths:
  - 'src/components/schedule/**'
  - 'src/hooks/useCalendarEvents.ts'
  - 'src/constants/calendarColors.ts'
---

# react-native-calendars Deep-Dive

Docs: [react-native-calendars](https://github.com/wix/react-native-calendars)

## Architecture

The calendar uses `CalendarProvider` + `ExpandableCalendar` from `react-native-calendars`. Events come from PowerSync via `useCalendarEvents`, and are transformed into `markedDates` via `useMarkedDates`.

```
CalendarProvider (date management, gestures)
  └─ ExpandableCalendar (week ↔ month toggle with knob)
       └─ theme={calendarTheme}       ← from calendarColors.ts
       └─ markedDates={markedDates}   ← from useMarkedDates(events)
```

**Key files:**

- `src/components/schedule/WeekMonthCalendar.tsx` — main calendar component
- `src/hooks/useCalendarEvents.ts` — `useCalendarEvents()` + `useMarkedDates()`
- `src/constants/calendarColors.ts` — hex color constants for the calendar theme

## CalendarProvider + ExpandableCalendar

`CalendarProvider` manages internal date state and gesture coordination. **Critical pattern:** only pass the initial date via a ref — do NOT feed date changes back as a prop, or it creates a scroll-jump feedback loop:

```typescript
const initialDate = useRef(selectedDate);

<CalendarProvider
  date={initialDate.current}           // ← ref, NOT reactive state
  onDateChanged={handleDateChanged}     // ← user taps a date
  onMonthChange={handleMonthChange}     // ← visible month changes (swipe)
>
  <ExpandableCalendar
    theme={calendarTheme}
    markedDates={markedDates}
    firstDay={0}            // Sunday start
    closeOnDayPress={false} // stay expanded when tapping dates
    hideKnob={false}        // show the week↔month drag knob
    allowShadow={false}
    hideArrows              // no left/right month arrows
    headerStyle={headerContainerStyle}
  />
</CalendarProvider>
```

## Custom Header Trick

The built-in calendar header (month title + arrows) is hidden by collapsing it to 0px via `stylesheet.calendar.header` theme override. A custom `ScheduleHeader` component renders the month/year title instead.

**Important:** when overriding `stylesheet.calendar.header`, you must re-declare `week` styles — the override replaces the entire header stylesheet, losing defaults:

```typescript
'stylesheet.calendar.header': {
  header: { height: 0, overflow: 'hidden' as const },
  week: {                    // ← must redeclare or day-name row breaks
    marginTop: 7,
    marginBottom: -4,
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
  },
},
```

The outer container height is forced to `HEADER_HEIGHT = 32` via `headerStyle` so `ExpandableCalendar`'s positioning math stays correct.

## Theme Configuration

Calendar colors live in `src/constants/calendarColors.ts` (hex values required by the library):

| Key             | Color             | Purpose                     |
| --------------- | ----------------- | --------------------------- |
| `today`         | `#00DB74` (green) | Today's date circle         |
| `selected`      | `#00B0DB` (blue)  | Selected date circle        |
| `eventDot`      | `#00DB74` (green) | Dot below dates with events |
| `disabled`      | `#A3A3A3`         | Adjacent month dates        |
| `background`    | `#FFFFFF`         | Calendar background         |
| `dayText`       | `#262627`         | Date number text            |
| `dayHeaderText` | `#666666`         | Day-of-week letters         |

These map to `calendarTheme` properties like `todayBackgroundColor`, `selectedDayBackgroundColor`, `dotColor`, etc.

## Event Data Flow (PowerSync → Calendar)

### useCalendarEvents(startDate, endDate)

Reactive query returning events whose time span overlaps the given range:

```sql
SELECT * FROM events
WHERE deleted_at IS NULL
  AND start_time <= ?     -- endDateTime (end of range)
  AND end_time >= ?       -- startDateTime (start of range)
ORDER BY start_time ASC
```

Parameters are ISO 8601 with time: `startDate + 'T00:00:00Z'` and `endDate + 'T23:59:59Z'`.

### useMarkedDates(events)

Transforms an `Event[]` into the `markedDates` object format:

```typescript
{ '2026-02-15': { marked: true, dotColor: '#00DB74' } }
```

- Uses `useMemo` keyed on `events` array reference
- Skips events with null or invalid `start_time`
- Deduplicates — multiple events on the same date produce one dot
- Returns a stable `EMPTY_MARKED` constant when there are no events (referential equality optimization)

### Query Range Buffering

The calendar queries ±1 month around the currently visible month to pre-fetch data for swipes:

```typescript
function getQueryRange(dateString: string) {
  // start = first day of previous month
  // end = last day of next month
}
```

The query date updates on `onMonthChange` (when the user swipes to a new month), not on every date tap.

## Testing

### Jest Mock (jest.setup.js)

```javascript
jest.mock('react-native-calendars', () => ({
  CalendarProvider: ({ children }) => children, // passthrough wrapper
  ExpandableCalendar: jest.fn(() => null), // renders nothing
}));
```

### Testing useCalendarEvents

Mock `@powersync/react`'s `useQuery` to control the return value:

```typescript
const mockUseQuery = jest.fn().mockReturnValue({ data: [], isLoading: false, error: undefined });
jest.mock('@powersync/react', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));
```

### Testing useMarkedDates

Use a `makeEvent()` helper for readable test data:

```typescript
function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: 'evt-1',
    calendar_id: 'cal-1',
    created_by_user_id: 'user-1',
    title: 'Test Event',
    description: '',
    start_time: '2026-02-15T10:00:00Z',
    end_time: '2026-02-15T11:00:00Z',
    is_recurring: 0,
    deleted_at: null,
    inserted_at: '2026-02-01T00:00:00Z',
    updated_at: '2026-02-01T00:00:00Z',
    ...overrides,
  } as Event;
}
```

**Key test cases to cover:** empty events, single event marking, same-date deduplication, null/invalid start_time handling, stable empty reference.

## Common Gotchas

- **Scroll-jump loop:** Never pass a reactive state variable as `CalendarProvider`'s `date` prop. Use a ref for the initial value.
- **Header override kills day-name row:** `stylesheet.calendar.header` replaces the _entire_ header stylesheet — you must re-declare `week` styles.
- **TypeScript types:** Import `DateData` from `react-native-calendars` for callback signatures (`onMonthChange` gives `DateData`, not a string).
- **Date parsing:** The library works with `YYYY-MM-DD` strings. Avoid timezone issues by appending `T12:00:00` when constructing `Date` objects for range calculations.
- **Large event sets:** `useMarkedDates` runs in `useMemo` on every event array change. The ±1 month query buffer keeps the working set small, but if adding multi-month views, consider pagination.
