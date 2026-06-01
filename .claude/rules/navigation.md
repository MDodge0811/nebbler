---
paths:
  - 'src/navigation/**'
  - 'src/screens/**'
---

# Navigation Rules

React Navigation 7 with native stack, drawer, and bottom tabs.

## Hierarchy

`NativeStackNavigator` → `DrawerNavigator` (right-side push, `id="MainDrawer"`) → `BottomTabNavigator`

- **Tabs:** `Calendars`, `Home` (default, renders ScheduleScreen), `Create` (action-only — redirects to CreateEvent via CustomTabBar, never renders), `People`, `Settings`
- **Stack screens** (outside tabs): `Profile`, `CreateEvent`
- **Drawer:** right-side push (`drawerType: 'slide'`), content in `src/components/schedule/DrawerContent.tsx`
- **Route types** and `CompositeScreenProps` chains defined in `src/navigation/types.ts`

## Key Gotcha

`useNavigation()` inside a tab screen returns the **tab navigator**, NOT the drawer. Use `navigation.getParent('MainDrawer')` to dispatch drawer actions like `DrawerActions.toggleDrawer()`.

## Custom Headers

Screens with custom headers set `headerShown: false` on their tab options and use `useSafeAreaInsets()` for top padding.

## Screen Decomposition Pattern

High-complexity screens are split into a thin orchestrator + presentational bodies + a form hook (see `EventDetailScreen`, `CreateEventScreen`, `CalendarDetailScreen`):

- **`use<Screen>Form(entity, onDone)` hook** (`src/hooks/`) owns state, validation, and handlers; takes a navigation callback (e.g. `goBack`) rather than touching `navigation` directly
- **Presentational view/edit bodies** live in a per-screen subdir (e.g. `src/screens/calendarDetail/`) with co-located `styles.ts` / `icons.tsx`
- The screen file wires the hook to the bodies and owns only the `navigation.setOptions` headers

This keeps each function under the complexity ceiling and isolates pure logic (e.g. `isCreateCalendarDirty`, `buildCalendarUpdates`) for unit tests.

## Adding a New Screen

1. Create the component in `src/screens/`
2. Add the route to `src/navigation/types.ts`
3. Register in `src/navigation/AppNavigator.tsx`
4. Re-export from `src/screens/index.ts`

## User Data in Screens

There are two "user" objects (auth user vs. DB user) — see `.claude/rules/auth.md` for the full two-layer user model. Key point: use `useCurrentUser()` and fall back to `authUser.email` when the DB user hasn't synced yet.
