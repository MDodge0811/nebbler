---
paths:
  - 'src/components/schedule/**'
  - 'src/hooks/useCalendarEvents.ts'
  - 'src/constants/calendarColors.ts'
---

# Custom Calendar Deep-Dive

## Architecture

```
CalendarContainer (Reanimated animated height + Gesture.Pan)
├── WeekStripDayHeaders (static S M T W T F S row)
├── WeekStrip (week view — FlatList<WeekPage>, pagingEnabled)
│   └── WeekStripDayCell × 7 per page
├── MonthGrid (month view — FlatList<MonthPage>, pagingEnabled)
│   └── WeekStripDayCell × 7 per row (reused)
└── GrabHandle (drag target for expand/collapse)
```

**Key files:**

| File                                                         | Purpose                                                                               |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| `src/components/schedule/CalendarContainer.tsx`              | Orchestrator — animated height, pan gesture, view switching                           |
| `src/components/schedule/GrabHandle.tsx`                     | Visual drag handle + hit area                                                         |
| `src/components/schedule/week-strip/WeekStrip.tsx`           | Week view — FlatList paging, day press, swipe sync                                    |
| `src/components/schedule/week-strip/WeekStripDayCell.tsx`    | Single day cell (shared by week + month)                                              |
| `src/components/schedule/week-strip/WeekStripDayHeaders.tsx` | Static day-of-week header row                                                         |
| `src/components/schedule/week-strip/useWeekPages.ts`         | Generates ±6 week buffer of `WeekPage` objects                                        |
| `src/components/schedule/month-grid/MonthGrid.tsx`           | Month view — FlatList paging, adjacent-month tap, swipe sync                          |
| `src/components/schedule/month-grid/useMonthPages.ts`        | Generates ±6 month buffer of `MonthPage` objects                                      |
| `src/utils/weekUtils.ts`                                     | Pure date math: `getWeekStart`, `getWeekDates`, `getWeekOffset`, `getWeekMonth`       |
| `src/utils/monthUtils.ts`                                    | Pure date math: `getMonthGrid`, `getMonthStart`, `getMonthOffset`, `getMonthRowCount` |
| `src/hooks/useCalendarEvents.ts`                             | `useCalendarEvents()` + `useMarkedDates()` — PowerSync event queries                  |
| `src/constants/calendarColors.ts`                            | Hex color constants for the calendar                                                  |

## Store-Driven Design

`CalendarContainer` and its children read state from `useScheduleStore` via selectors:

| Field          | Used by                      | Purpose                                                 |
| -------------- | ---------------------------- | ------------------------------------------------------- |
| `selectedDate` | WeekStrip, MonthGrid         | Highlights the tapped day cell                          |
| `today`        | WeekStrip, MonthGrid         | Anchors week/month buffers, highlights today            |
| `viewMode`     | CalendarContainer            | `'week'` or `'month'` — controls which sub-view renders |
| `displayMonth` | CalendarContainer, MonthGrid | The month shown in MonthGrid (`YYYY-MM-01`)             |
| `visibleDate`  | WeekStrip, MonthGrid         | Updates header month text on swipe                      |
| `isSyncLocked` | WeekStrip, MonthGrid         | Suppresses tap handling during programmatic sync        |

**Action semantics:**

- `selectDate(date)` — sets `selectedDate` + `visibleDate` (user taps a day)
- `setVisibleDate(date)` — sets only `visibleDate` (user swipes without tapping)
- `setViewMode(mode)` — switches between `'week'` and `'month'`
- `setDisplayMonth(month)` — sets the month for MonthGrid

## Month Expansion (Gesture + Reanimated)

`CalendarContainer` uses Reanimated's `useSharedValue` + `useAnimatedStyle` for animated height, and Gesture Handler's `Gesture.Pan()` for the drag interaction.

**Height calculation:**

- Collapsed: `DAY_HEADERS_HEIGHT (24) + WEEK_ROW_HEIGHT (40) + GRAB_HANDLE_HEIGHT (8)` = 72
- Expanded: `DAY_HEADERS_HEIGHT + getMonthRowCount(displayMonth) × ROW_HEIGHT (40) + GRAB_HANDLE_HEIGHT` (varies: 4–6 rows)

**Spring config:** `{ damping: 28, stiffness: 400, mass: 0.8 }`

**Snap logic (in `onEnd` worklet):**

- Velocity > 500 → snap to that direction
- Otherwise, snap based on position threshold (40% travel)

**Conditional rendering:** WeekStrip renders only in week mode. MonthGrid uses a `hasExpandedRef` to stay mounted once expanded (avoids remount costs on rapid toggle). Both are never mounted simultaneously.

**worklet boundary:** Pan gesture callbacks (`onStart`, `onUpdate`, `onEnd`) run on the UI thread as worklets. Store mutations (`handleExpand`, `handleCollapse`) are called via `runOnJS()`.

## Week Swiping

- `FlatList` with `pagingEnabled` — native snap-to-page
- `useWeekPages(today)` generates ±6 week buffer (13 total pages) anchored on today
- `getItemLayout` (fixed width = screen width) enables instant `scrollToIndex`
- `onMomentumScrollEnd` detects page change → updates `visibleDate` if the week's month changed
- External sync: `useEffect` watches `selectedDate` → `scrollToIndex({ animated: false })`
- Week-to-month mapping uses ISO Thursday convention (`getWeekMonth`)

## Month Swiping

- `FlatList<MonthPage>` with `pagingEnabled` — same snap pattern as WeekStrip
- `useMonthPages(displayMonth)` generates ±6 month buffer (13 total pages)
- Uses `scrollToOffset` (not `scrollToIndex`) for external sync — more reliable for programmatic scrolling
- `onMomentumScrollEnd` detects page change → calls `setDisplayMonth` + `setVisibleDate`
- Adjacent-month day tap: tapping a grayed-out day navigates to that month via `setDisplayMonth`

## Colors

Calendar colors in `src/constants/calendarColors.ts`:

| Key             | Color             | Purpose                     |
| --------------- | ----------------- | --------------------------- |
| `today`         | `#00DB74` (green) | Today's date circle         |
| `selected`      | `#00DB74` (green) | Selected date circle        |
| `eventDot`      | `#00DB74` (green) | Dot below dates with events |
| `disabled`      | `#A3A3A3`         | Adjacent month dates        |
| `background`    | `#FFFFFF`         | Calendar background         |
| `dayText`       | `#262627`         | Date number text            |
| `dayHeaderText` | `#666666`         | Day-of-week letters         |

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

The calendar queries ±1 month around the currently visible month to pre-fetch data for swipes.

## Date Math Convention

All date utilities in `weekUtils.ts` and `monthUtils.ts` use `T12:00:00` noon-pinning to avoid timezone/DST boundary issues. This matches the project-wide convention in `dateRange.ts`.

## Testing

### Jest Mocks (jest.setup.js)

`react-native-reanimated` is mocked via `react-native-reanimated/mock`. The `Gesture.Pan()` mock in `react-native-gesture-handler` returns chainable methods:

```javascript
Gesture: {
  Pan: () => ({
    activeOffsetY: jest.fn().mockReturnThis(),
    failOffsetX: jest.fn().mockReturnThis(),
    onStart: jest.fn().mockReturnThis(),
    onUpdate: jest.fn().mockReturnThis(),
    onEnd: jest.fn().mockReturnThis(),
  }),
},
```

**When adding new chained methods** to the pan gesture, add matching `jest.fn().mockReturnThis()` entries.

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
    deleted_at: null,
    inserted_at: '2026-02-01T00:00:00Z',
    updated_at: '2026-02-01T00:00:00Z',
    ...overrides,
  } as Event;
}
```

**Key test cases:** empty events, single event marking, same-date deduplication, null/invalid start_time handling, stable empty reference.

## Gotchas

- **worklet/JS boundary:** Pan gesture callbacks are worklets. Store mutations must go through `runOnJS()`. Forgetting this causes a "Cannot access JS function from worklet" error.
- **`scrollToOffset` > `scrollToIndex` for MonthGrid:** MonthGrid uses `scrollToOffset` for programmatic sync because `scrollToIndex` can be unreliable when page dimensions depend on dynamic row counts.
- **Bidirectional sync guards:** Both WeekStrip and MonthGrid check `isSyncLocked` before handling taps, and compare `currentPageRef` before updating store on scroll — this prevents feedback loops where a store update triggers a scroll that triggers another store update.
- **Noon-pinning in date math:** `new Date(dateString + 'T12:00:00')` in weekUtils/monthUtils. Using midnight can shift dates across day boundaries depending on device timezone.
- **MonthGrid stays mounted:** Once expanded, MonthGrid stays mounted (via `hasExpandedRef`) even when collapsed back to week mode. This avoids remount costs but means MonthGrid continues to hold state.
- **Multi-day events:** `useMarkedDates` uses only `start_time` to place dots — multi-day events only get a dot on their start date.
