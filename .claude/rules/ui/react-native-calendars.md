---
paths:
  - 'src/components/schedule/**'
  - 'src/hooks/useCalendarEvents.ts'
  - 'src/constants/calendarColors.ts'
---

# Custom WeekStrip Calendar

`react-native-calendars` has been replaced with a custom week-strip calendar built from scratch.

## Architecture

```
WeekStrip (orchestrator — FlatList + day cells)
├── WeekStripDayHeaders (static S M T W T F S row)
├── FlatList<WeekPage> (horizontal, pagingEnabled, ±6 week buffer)
│   └── WeekStripDayCell × 7 per page (memo'd presentational component)
└── useWeekPages(anchorDate) (data hook: generates week pages)
    └── weekUtils.ts (pure date math)
```

**Key files:**

- `src/components/schedule/week-strip/WeekStrip.tsx` — orchestrator
- `src/components/schedule/week-strip/WeekStripDayCell.tsx` — single day cell
- `src/components/schedule/week-strip/WeekStripDayHeaders.tsx` — day header row
- `src/components/schedule/week-strip/useWeekPages.ts` — week page generation hook
- `src/utils/weekUtils.ts` — pure date math utilities
- `src/hooks/useCalendarEvents.ts` — `useCalendarEvents()` + `useMarkedDates()`
- `src/constants/calendarColors.ts` — hex color constants

## Store-Driven Design

The WeekStrip reads state directly from `useScheduleStore` via selectors:

- `selectedDate` — highlights the tapped day cell
- `today` — anchors the week buffer and highlights today
- `isSyncLocked` — prevents tap handling during programmatic sync
- `setVisibleDate` — updates the header month on week swipe

No CalendarProvider wrapper or context bridge needed.

## Colors

Calendar colors in `src/constants/calendarColors.ts`:

| Key             | Color             | Purpose                     |
| --------------- | ----------------- | --------------------------- |
| `today`         | `#00DB74` (green) | Today's date circle         |
| `selected`      | `#00B0DB` (blue)  | Selected date circle        |
| `eventDot`      | `#00DB74` (green) | Dot below dates with events |
| `dayText`       | `#262627`         | Date number text            |
| `dayHeaderText` | `#666666`         | Day-of-week letters         |

## Week Swiping

- `FlatList` with `pagingEnabled` — native snap-to-page
- `getItemLayout` (fixed width = screen width) enables instant `scrollToIndex`
- `onMomentumScrollEnd` detects user swipe → updates `visibleDate` if month changed
- External sync via `useEffect` watching `selectedDate` → `scrollToIndex({ animated: false })`

## Month Expansion (Future)

Store has `isMonthExpanded` + `toggleMonthExpanded()`. WeekStrip is ready to swap in a `MonthGrid` when expanded. `WeekStripDayCell` can be reused in the grid.

## Date Math

All date utilities in `src/utils/weekUtils.ts` use `T12:00:00` noon-pinning to avoid timezone/DST issues, matching the project's `dateRange.ts` convention.
