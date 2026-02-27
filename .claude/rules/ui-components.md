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

## Custom WeekStrip Calendar

- Custom week-strip calendar in `src/components/schedule/week-strip/`
- Event data flows from PowerSync via `useCalendarEvents()` → `useMarkedDates()` → `markedDates` prop
- Calendar colors: `src/constants/calendarColors.ts`
- Store-driven: reads `selectedDate`, `today`, `isSyncLocked` directly from `useScheduleStore`

## Colors

- Theme color palette: `src/constants/colors.ts`
- Calendar-specific colors: `src/constants/calendarColors.ts`
- Gluestack CSS variable colors: `components/ui/gluestack-ui-provider/config.ts` (light/dark mode)

## Deep-Dive References

| Topic              | File                                         | When to Read                                                          |
| ------------------ | -------------------------------------------- | --------------------------------------------------------------------- |
| Gluestack UI       | `.claude/rules/ui/gluestack.md`              | Adding/modifying/removing Gluestack components, theming, TVA patterns |
| WeekStrip Calendar | `.claude/rules/ui/react-native-calendars.md` | Working on schedule calendar, event display, date selection           |
