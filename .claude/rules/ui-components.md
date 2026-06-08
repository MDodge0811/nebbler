---
paths:
  - 'src/components/**'
  - 'components/ui/**'
---

# UI Component Rules

## Styling Contract (the one way to style)

NativeWind `className` + Gluestack is the **only** sanctioned styling path, enforced as
hard lint errors. No `StyleSheet.create`, no inline `style={{...}}`, no color literals,
no raw `View`/`Text`/`Pressable`/`Image`/`TouchableOpacity` from `react-native`.

- **Static styling** → `className` (use `tva()` for variants). Use Gluestack `Box`/`Text`/
  `Pressable`/`VStack`/`HStack` instead of the raw RN primitives.
- **Runtime styling that can't be a class** (data-driven color, `zIndex`, drag-driven
  `top`, safe-area-inset padding) → the named door in `components/ui/dynamic/`:
  `DynamicColorView` (background/border/shadow color, `zIndex`, `top`, `paddingTop/Bottom`)
  and `DynamicColorText` (text color). Never an inline `style` or `eslint-disable`.
- A small **closed** set of reanimated/runtime-dimension files is path-exempted in
  `eslint.config.js` (CalendarCheckbox, SyncStatusIndicator, WeekStrip, MonthGrid +
  `components/ui/dynamic/**`). Don't grow it — migrate instead. See
  `.claude/rules/code-quality.md` for the full contract and exempt list.

## Icons

- Use `react-native-svg` (`Svg`, `Circle`, `Path`) for simple custom icons — no icon library installed
- Example: meatball menu icon (`OverflowMenu.tsx`), chevrons, etc.

## Gluestack UI

- `npx gluestack-ui add <component>` scaffolds into `components/ui/<component>/`
- If you remove usage of a Gluestack component, delete its directory from `components/ui/` — they are not cleaned up automatically
- Adding new Gluestack components may require adding new functions to the `nativewind` mock in `jest.setup.js`
- Uses TVA (Tailwind Variants Array) pattern with NativeWind — `tva()`, `withStyleContext`, `useStyleContext`

## Custom Calendar (Week + Month)

- Entry point: `CalendarContainer` → `src/components/schedule/CalendarContainer.tsx`
- Week view: `src/components/schedule/week-strip/`
- Month view: `src/components/schedule/month-grid/`
- Event data: PowerSync → `useCalendarEvents()` → `useMarkedDates()` → `markedDates` prop
- Colors: `src/constants/calendarColors.ts`
- Store-driven: reads `selectedDate`, `today`, `viewMode`, `displayMonth` from `useScheduleStore`

## Colors

- Theme color palette: `src/constants/colors.ts`
- Calendar-specific colors: `src/constants/calendarColors.ts`
- Gluestack CSS variable colors: `components/ui/gluestack-ui-provider/config.ts` (light/dark mode)
- Brand chrome hexes with no exact palette match live under the `brand-*` namespace
  (e.g. `bg-brand-primary`, `bg-brand-handle`). Add a new one to **both** the light and
  dark blocks in `config.ts`, the `brand` color map in `tailwind.config.js`, and the
  safelist regex — and keep the hex byte-exact, never a near-match.

## Deep-Dive References

| Topic        | File                            | When to Read                                                             |
| ------------ | ------------------------------- | ------------------------------------------------------------------------ |
| Gluestack UI | `.claude/rules/ui/gluestack.md` | Adding/modifying/removing Gluestack components, theming, TVA patterns    |
| Calendar     | `.claude/rules/ui/calendar.md`  | Working on schedule calendar, week/month views, gestures, date selection |
