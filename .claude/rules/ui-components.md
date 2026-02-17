---
paths:
  - 'src/components/**'
  - 'components/ui/**'
---

# UI Component Rules

## Icons

- Use `react-native-svg` (`Svg`, `Circle`, `Path`) for simple custom icons — no icon library installed
- Example: meatball menu icon (`OverflowMenu.tsx`), chevrons, etc.

## Gluestack UI

- `npx gluestack-ui add <component>` scaffolds into `components/ui/<component>/`
- If you remove usage of a Gluestack component, delete its directory from `components/ui/` — they are not cleaned up automatically
- Adding new Gluestack components may require adding new functions to the `nativewind` mock in `jest.setup.js`
- Uses TVA (Tailwind Variants Array) pattern with NativeWind — `tva()`, `withStyleContext`, `useStyleContext`

## react-native-calendars

- `CalendarProvider` + `ExpandableCalendar` in `src/components/schedule/WeekMonthCalendar.tsx`
- Event data flows from PowerSync via `useCalendarEvents()` → `useMarkedDates()` → `markedDates` prop
- Calendar colors: `src/constants/calendarColors.ts` (hex values required by the library)
- **Gotcha:** Never pass reactive state as `CalendarProvider`'s `date` prop — use a ref for initial value

## Colors

- Theme color palette: `src/constants/colors.ts`
- Calendar-specific colors: `src/constants/calendarColors.ts`
- Gluestack CSS variable colors: `components/ui/gluestack-ui-provider/config.ts` (light/dark mode)

## Deep-Dive References

| Topic                  | File                                         | When to Read                                                          |
| ---------------------- | -------------------------------------------- | --------------------------------------------------------------------- |
| Gluestack UI           | `.claude/rules/ui/gluestack.md`              | Adding/modifying/removing Gluestack components, theming, TVA patterns |
| react-native-calendars | `.claude/rules/ui/react-native-calendars.md` | Working on schedule calendar, event display, date selection           |
