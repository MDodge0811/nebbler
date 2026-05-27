# CalendarDetailScreen (NEB-62) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:subagent-driven-development (recommended) or superpowers-extended-cc:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the stub `CalendarDetailScreen` with a full view/edit screen matching the mockup at `Phase 0 — MVP/Designs/CalendarDetailScreen — Mockup.jsx`, gated by role-level permissions and reading entirely from PowerSync.

**Architecture:** Frontend-only React Native screen (backend already shipped via NEB-123/124). One screen with two modes — `view` and `edit` — toggled by a pencil icon. View mode renders calendar identity card, upcoming events list, and optional members section. Edit mode (role ≥ 30) shows live preview, name/description/color editors, settings toggles, and a danger zone (owner only). Data composed by a single `useCalendarDetail` hook over PowerSync reactive queries. Shared row/badge/toggle primitives extracted into `src/components/calendars/` for future reuse on CalendarMembersScreen and HomeScreen.

**Tech Stack:** React Native, Expo 54, TypeScript, PowerSync (`@powersync/react`), React Navigation native-stack, Zod for form validation, Jest + `@testing-library/react-native` for tests.

---

## File Structure

**Create:**

- `nebbler/src/components/calendars/CalendarTypeBadge.tsx` — calendar-color-tinted badge with type icon + label (private/social/public)
- `nebbler/src/components/calendars/RsvpBadge.tsx` — Going / Maybe / Not Going pill
- `nebbler/src/components/calendars/RoleBadge.tsx` — Owner / Admin / Member pill
- `nebbler/src/components/calendars/EventRow.tsx` — event list row with free/busy variant
- `nebbler/src/components/calendars/MemberRow.tsx` — member list row (avatar + name + role badge)
- `nebbler/src/components/calendars/ToggleRow.tsx` — labelled toggle with description (settings row)
- `nebbler/src/components/calendars/DeleteCalendarConfirmModal.tsx` — confirmation modal
- `nebbler/src/components/calendars/__tests__/*.test.tsx` — one test file per new component
- `nebbler/src/database/schemas/updateCalendarSchema.ts` — Zod schema for edit-mode form
- `nebbler/src/database/schemas/__tests__/updateCalendarSchema.test.ts`
- `nebbler/src/hooks/useCalendarDetail.ts` — composite hook (calendar + owner + members + events + permissions + effective view_mode)
- `nebbler/src/hooks/__tests__/useCalendarDetail.test.ts`
- `nebbler/src/screens/__tests__/CalendarDetailScreen.test.tsx`

**Modify:**

- `nebbler/src/screens/CalendarDetailScreen.tsx` — full rewrite (currently a 16-line stub)
- `nebbler/src/database/schemas/index.ts` — re-export `UpdateCalendarSchema`

**Not touched:**

- `nebbler/src/hooks/useCalendars.ts` — `updateCalendar` already supports name/description/color/rsvp_enabled/discoverable/affects_availability dynamically (verified at L96–123). `deleteCalendar` issues `DELETE FROM calendars` which PowerSync forwards to the backend; the backend translates to soft-delete and the local query already filters `deleted_at IS NULL`.
- `nebbler/src/navigation/AppNavigator.tsx` — `CalendarDetail` route already registered (L94). Header config will be set per-screen via `navigation.setOptions`, mirroring `CreateCalendarScreen.tsx:L437–490`.
- `nebbler/src/components/calendars/TypeBadge.tsx` — used by `CalendarRow` for compact list view; left alone. New `CalendarTypeBadge` is the detail-screen variant (calendar-color tinted, includes private).

---

## Conventions to Follow

- Style with React Native `StyleSheet` + `calendarsUIColors` tokens (see `CreateCalendarScreen.tsx`); use `tva` from `@gluestack-ui/utils/nativewind-utils` only for the screen container class.
- Hooks return `{ data, isLoading, error }` shape from PowerSync `useQuery`. Conditional queries use the `'SELECT … WHERE 0'` empty-result pattern (see `useCalendars.ts:L18`).
- SQLite booleans are integers (0/1) in PowerSync — convert with `=== 1` checks (see `useEventDetail.ts:L73`).
- Toast = absolutely-positioned in-screen banner inside the screen tree (no external toast lib). Mirrors mockup `showSaved` pattern.
- Tests follow the `ScheduleScreen.test.tsx` style: mock hooks at the module boundary, then `render(<Screen />)` and assert via `getByText`/`getByTestId`.

---

## Self-Review Pre-Check

Spec coverage cross-walk:

- Header back/title/edit-pencil → Task 6
- Calendar header card, type badge, owner, member count, description → Task 6
- Upcoming events list (chronological, free/busy variant, empty state) → Tasks 2 + 6
- Members section (private hidden, social/public expandable, invite, see-all) → Tasks 2 + 6
- FAB visibility (role ≥ 20 ∧ not free_busy) → Task 6
- Edit mode header morph, preview, name/desc/color/toggles → Task 7
- Discoverable toggle only when type === 'public' → Task 7
- Danger zone (owner only) + delete modal → Tasks 3 + 8
- Save: PATCH, success toast, return to view mode, error keeps edit mode → Task 8
- Reactive pop-back on membership removed / calendar deleted → Task 9
- Permissions matrix (10/20/30/40) → Task 1 (computed) + Tasks 6/7 (gated render)
- View mode reading from PowerSync local queries → Task 1

No gate language present in the user brief or spec. No `userGate` tagging.

---

## Task 1: `useCalendarDetail` Composite Hook

**Goal:** One reactive hook returning everything CalendarDetailScreen needs: the calendar, owner display name, current user's membership/role-level, joined member list, upcoming events, and computed permissions including `effectiveViewMode`.

**Files:**

- Create: `nebbler/src/hooks/useCalendarDetail.ts`
- Create: `nebbler/src/hooks/__tests__/useCalendarDetail.test.ts`

**Acceptance Criteria:**

- [ ] Returns `{ calendar, ownerName, currentMembership, members, upcomingEvents, permissions, isLoading }`
- [ ] `currentMembership` has `role_level` and `role_name` joined from `roles`
- [ ] `members` is an array of `{ id, user_id, role_id, role_level, role_name, display_name, avatar_initial }`, sorted owner → admin → member by role level desc, then display_name asc
- [ ] `upcomingEvents` are events where `calendar_id = ?`, `deleted_at IS NULL`, `start_time >= now()`, ordered by `start_time` asc
- [ ] `permissions` has `{ canView, canEnterEdit, canSave, canDelete, canCreateEvent, isFreeBusy }`:
  - `canView` = role_level ≥ 10
  - `canEnterEdit` = canSave = role_level ≥ 30
  - `canDelete` = role_level === 40
  - `canCreateEvent` = role_level ≥ 20
  - `isFreeBusy` = effectiveViewMode === 'free_busy'
- [ ] `effectiveViewMode` = `currentMembership.view_mode ?? calendar.default_view_mode`
- [ ] When `calendarId` is undefined or membership not yet synced, all queries return empty results without throwing
- [ ] Tests cover: owner permissions, admin permissions, member permissions, free_busy view mode flag, member sort order, empty calendar (no events / no members)

**Verify:** `npm run test -- useCalendarDetail` → all tests pass, no console warnings.

**Steps:**

- [ ] **Step 1: Write failing tests**

Create `nebbler/src/hooks/__tests__/useCalendarDetail.test.ts`:

```ts
import { renderHook } from '@testing-library/react-native';
import { useCalendarDetail } from '../useCalendarDetail';

// Captured by mock queries — each call returns the next row set
const queryResponses: Array<{ data: unknown[] }> = [];
jest.mock('@powersync/react', () => ({
  useQuery: jest.fn(() => queryResponses.shift() ?? { data: [] }),
}));
jest.mock('../useCurrentUser', () => ({
  useCurrentUser: () => ({ authUser: { id: 'user-1' } }),
}));

function queue(...batches: unknown[][]) {
  queryResponses.length = 0;
  for (const b of batches) queryResponses.push({ data: b });
}

const calendar = {
  id: 'cal-1',
  owner_id: 'user-1',
  type: 'social',
  name: 'Game Night',
  description: 'd',
  color: '#A78BFA',
  rsvp_enabled: 1,
  discoverable: 0,
  default_view_mode: 'full',
  household_sharing: 1,
  affects_availability: 1,
  deleted_at: null,
};

describe('useCalendarDetail', () => {
  it('returns owner permissions when current user has role level 40', () => {
    queue(
      [calendar],
      [{ id: 'user-1', display_name: 'You', first_name: 'You' }],
      [
        {
          id: 'm1',
          user_id: 'user-1',
          role_id: 'r-owner',
          view_mode: null,
          role_level: 40,
          role_name: 'owner',
        },
      ],
      [],
      []
    );
    const { result } = renderHook(() => useCalendarDetail('cal-1'));
    expect(result.current.permissions.canEnterEdit).toBe(true);
    expect(result.current.permissions.canDelete).toBe(true);
    expect(result.current.permissions.canCreateEvent).toBe(true);
    expect(result.current.permissions.isFreeBusy).toBe(false);
    expect(result.current.effectiveViewMode).toBe('full');
  });

  it('admin (level 30) cannot delete but can edit + create events', () => {
    queue(
      [calendar],
      [{ id: 'user-9', display_name: 'Owner', first_name: 'Owner' }],
      [
        {
          id: 'm1',
          user_id: 'user-1',
          role_id: 'r-admin',
          view_mode: null,
          role_level: 30,
          role_name: 'admin',
        },
      ],
      [],
      []
    );
    const { result } = renderHook(() => useCalendarDetail('cal-1'));
    expect(result.current.permissions.canEnterEdit).toBe(true);
    expect(result.current.permissions.canDelete).toBe(false);
    expect(result.current.permissions.canCreateEvent).toBe(true);
  });

  it('member (level 10) is view-only', () => {
    queue(
      [calendar],
      [{ display_name: 'Owner' }],
      [{ role_level: 10, role_name: 'member', view_mode: null }],
      [],
      []
    );
    const { result } = renderHook(() => useCalendarDetail('cal-1'));
    expect(result.current.permissions.canEnterEdit).toBe(false);
    expect(result.current.permissions.canCreateEvent).toBe(false);
  });

  it('free_busy effective view mode is detected', () => {
    queue(
      [calendar],
      [{ display_name: 'Owner' }],
      [{ role_level: 10, role_name: 'member', view_mode: 'free_busy' }],
      [],
      []
    );
    const { result } = renderHook(() => useCalendarDetail('cal-1'));
    expect(result.current.effectiveViewMode).toBe('free_busy');
    expect(result.current.permissions.isFreeBusy).toBe(true);
  });

  it('members sorted owner → admin → member, then by display_name', () => {
    queue(
      [calendar],
      [{ display_name: 'Owner' }],
      [{ role_level: 40, role_name: 'owner' }],
      [
        { id: 'mz', user_id: 'u3', role_level: 10, display_name: 'Zoe' },
        { id: 'ma', user_id: 'u4', role_level: 10, display_name: 'Alex' },
        { id: 'mo', user_id: 'u1', role_level: 40, display_name: 'Owner' },
        { id: 'mad', user_id: 'u2', role_level: 30, display_name: 'Sarah' },
      ],
      []
    );
    const { result } = renderHook(() => useCalendarDetail('cal-1'));
    const names = result.current.members.map((m) => m.display_name);
    expect(names).toEqual(['Owner', 'Sarah', 'Alex', 'Zoe']);
  });

  it('returns empty results when calendarId is undefined', () => {
    queue([], [], [], [], []);
    const { result } = renderHook(() => useCalendarDetail(undefined));
    expect(result.current.calendar).toBeNull();
    expect(result.current.members).toEqual([]);
    expect(result.current.upcomingEvents).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

Run: `cd nebbler && npm run test -- useCalendarDetail`
Expected: All FAIL — module not found.

- [ ] **Step 3: Implement the hook**

Create `nebbler/src/hooks/useCalendarDetail.ts`:

```ts
import { useMemo } from 'react';
import { useQuery } from '@powersync/react';
import { useCurrentUser } from '@hooks/useCurrentUser';
import type { Calendar, Event, User } from '@database/schema';

interface MembershipJoinRow {
  id: string;
  calendar_id: string;
  user_id: string;
  role_id: string;
  view_mode: string | null;
  can_delete_events: number;
  role_level: number;
  role_name: string;
}

interface MemberJoinRow {
  id: string;
  user_id: string;
  role_id: string;
  role_level: number;
  role_name: string;
  display_name: string | null;
  first_name: string | null;
}

export interface CalendarDetailMember {
  id: string;
  user_id: string;
  role_id: string;
  role_level: number;
  role_name: string;
  display_name: string;
  avatar_initial: string;
}

export interface CalendarDetailPermissions {
  canView: boolean;
  canEnterEdit: boolean;
  canSave: boolean;
  canDelete: boolean;
  canCreateEvent: boolean;
  isFreeBusy: boolean;
}

export function useCalendarDetail(calendarId: string | undefined) {
  const { authUser } = useCurrentUser();
  const userId = authUser?.id;

  const { data: calendars = [], isLoading: calLoading } = useQuery<Calendar>(
    calendarId
      ? 'SELECT * FROM calendars WHERE id = ? AND deleted_at IS NULL'
      : 'SELECT * FROM calendars WHERE 0',
    calendarId ? [calendarId] : []
  );
  const calendar = calendars[0] ?? null;

  const { data: owners = [] } = useQuery<User>(
    calendar?.owner_id ? 'SELECT * FROM users WHERE id = ?' : 'SELECT * FROM users WHERE 0',
    calendar?.owner_id ? [calendar.owner_id] : []
  );
  const ownerName = owners[0]?.display_name ?? owners[0]?.first_name ?? '';

  const { data: memberships = [] } = useQuery<MembershipJoinRow>(
    calendarId && userId
      ? `SELECT cm.*, r.level AS role_level, r.name AS role_name
         FROM calendar_members cm
         JOIN roles r ON cm.role_id = r.id
         WHERE cm.calendar_id = ? AND cm.user_id = ? AND cm.deleted_at IS NULL`
      : 'SELECT * FROM calendar_members WHERE 0',
    calendarId && userId ? [calendarId, userId] : []
  );
  const currentMembership = memberships[0] ?? null;

  const { data: memberRows = [] } = useQuery<MemberJoinRow>(
    calendarId
      ? `SELECT cm.id, cm.user_id, cm.role_id,
                r.level AS role_level, r.name AS role_name,
                u.display_name, u.first_name
         FROM calendar_members cm
         JOIN roles r ON cm.role_id = r.id
         LEFT JOIN users u ON cm.user_id = u.id
         WHERE cm.calendar_id = ? AND cm.deleted_at IS NULL`
      : 'SELECT * FROM calendar_members WHERE 0',
    calendarId ? [calendarId] : []
  );

  const members = useMemo<CalendarDetailMember[]>(() => {
    return memberRows
      .map((m) => {
        const display = (m.display_name ?? m.first_name ?? '?').trim();
        return {
          id: m.id,
          user_id: m.user_id,
          role_id: m.role_id,
          role_level: m.role_level,
          role_name: m.role_name,
          display_name: display || '?',
          avatar_initial: (display[0] ?? '?').toUpperCase(),
        };
      })
      .sort((a, b) => {
        if (a.role_level !== b.role_level) return b.role_level - a.role_level;
        return a.display_name.localeCompare(b.display_name);
      });
  }, [memberRows]);

  const nowIso = useMemo(() => new Date().toISOString(), [calendarId]);
  const { data: upcomingEvents = [] } = useQuery<Event>(
    calendarId
      ? `SELECT * FROM events
         WHERE calendar_id = ? AND deleted_at IS NULL AND start_time >= ?
         ORDER BY start_time ASC`
      : 'SELECT * FROM events WHERE 0',
    calendarId ? [calendarId, nowIso] : []
  );

  const effectiveViewMode = currentMembership?.view_mode ?? calendar?.default_view_mode ?? 'full';

  const permissions = useMemo<CalendarDetailPermissions>(() => {
    const lvl = currentMembership?.role_level ?? 0;
    const isFreeBusy = effectiveViewMode === 'free_busy';
    return {
      canView: lvl >= 10,
      canEnterEdit: lvl >= 30,
      canSave: lvl >= 30,
      canDelete: lvl === 40,
      canCreateEvent: lvl >= 20 && !isFreeBusy,
      isFreeBusy,
    };
  }, [currentMembership, effectiveViewMode]);

  return {
    calendar,
    ownerName,
    currentMembership,
    members,
    upcomingEvents,
    effectiveViewMode,
    permissions,
    isLoading: calLoading,
  };
}
```

- [ ] **Step 4: Run tests to confirm pass**

Run: `cd nebbler && npm run test -- useCalendarDetail`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
cd nebbler && git add src/hooks/useCalendarDetail.ts src/hooks/__tests__/useCalendarDetail.test.ts
git commit -m "feat(calendar-detail): add useCalendarDetail composite hook"
```

---

## Task 2: Shared Calendar Components — Badges and Rows

**Goal:** Extract the badge/row primitives from the mockup into shared `src/components/calendars/` modules with snapshot-light render tests.

**Files:**

- Create: `nebbler/src/components/calendars/CalendarTypeBadge.tsx`
- Create: `nebbler/src/components/calendars/RsvpBadge.tsx`
- Create: `nebbler/src/components/calendars/RoleBadge.tsx`
- Create: `nebbler/src/components/calendars/EventRow.tsx`
- Create: `nebbler/src/components/calendars/MemberRow.tsx`
- Create: `nebbler/src/components/calendars/ToggleRow.tsx`
- Create: `nebbler/src/components/calendars/__tests__/CalendarTypeBadge.test.tsx`
- Create: `nebbler/src/components/calendars/__tests__/RsvpBadge.test.tsx`
- Create: `nebbler/src/components/calendars/__tests__/RoleBadge.test.tsx`
- Create: `nebbler/src/components/calendars/__tests__/EventRow.test.tsx`
- Create: `nebbler/src/components/calendars/__tests__/MemberRow.test.tsx`
- Create: `nebbler/src/components/calendars/__tests__/ToggleRow.test.tsx`

**Acceptance Criteria:**

- [ ] `CalendarTypeBadge` accepts `{ type: 'private' | 'social' | 'public', color: string }` and renders icon emoji + capitalized label, tinted with the calendar color
- [ ] `RsvpBadge` accepts `{ status: 'going' | 'maybe' | 'not_going' | null }` and returns null when null
- [ ] `RoleBadge` accepts `{ role: 'owner' | 'admin' | 'member' }`
- [ ] `EventRow` accepts `{ event, calendarColor, isFreeBusy, onPress }`. When `isFreeBusy`, shows `Busy` + time only, gray color bar, no RSVP/going count. Otherwise shows title + time range + optional RSVP badge + optional `{N} going` text + chevron
- [ ] `MemberRow` accepts `{ member, calendarColor }`, renders circular tinted avatar with initial + display name + `RoleBadge`
- [ ] `ToggleRow` accepts `{ checked, onChange, label, description }`, uses RN `Switch` with `calendarsUIColors.primary` track tint
- [ ] All components use `calendarsUIColors` tokens and `StyleSheet.create`
- [ ] Each test renders the component with a representative prop set and asserts the visible label / behavior

**Verify:** `npm run test -- components/calendars/__tests__` → all tests pass.

**Steps:**

- [ ] **Step 1: Write `CalendarTypeBadge` and its test**

Create `nebbler/src/components/calendars/CalendarTypeBadge.tsx`:

```tsx
import { StyleSheet, Text as RNText, View } from 'react-native';

const ICONS: Record<string, string> = {
  private: '🔒',
  social: '👥',
  public: '🌐',
};

interface CalendarTypeBadgeProps {
  type: 'private' | 'social' | 'public' | string;
  color: string;
}

export function CalendarTypeBadge({ type, color }: CalendarTypeBadgeProps) {
  const label = type.charAt(0).toUpperCase() + type.slice(1);
  return (
    <View style={[styles.badge, { backgroundColor: `${color}14`, borderColor: `${color}30` }]}>
      <RNText style={styles.icon}>{ICONS[type] ?? ''}</RNText>
      <RNText style={[styles.label, { color }]}>{label}</RNText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  icon: { fontSize: 11 },
  label: { fontSize: 12, fontWeight: '600', letterSpacing: 0.2 },
});
```

Create `nebbler/src/components/calendars/__tests__/CalendarTypeBadge.test.tsx`:

```tsx
import { render } from '@testing-library/react-native';
import { CalendarTypeBadge } from '../CalendarTypeBadge';

describe('CalendarTypeBadge', () => {
  it('renders the capitalized label', () => {
    const { getByText } = render(<CalendarTypeBadge type="social" color="#A78BFA" />);
    expect(getByText('Social')).toBeTruthy();
  });

  it('renders private with lock icon', () => {
    const { getByText } = render(<CalendarTypeBadge type="private" color="#00DB74" />);
    expect(getByText('🔒')).toBeTruthy();
    expect(getByText('Private')).toBeTruthy();
  });

  it('renders public with globe icon', () => {
    const { getByText } = render(<CalendarTypeBadge type="public" color="#00DB74" />);
    expect(getByText('🌐')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Write `RsvpBadge` and its test**

Create `nebbler/src/components/calendars/RsvpBadge.tsx`:

```tsx
import { StyleSheet, Text as RNText, View } from 'react-native';
import { calendarsUIColors } from '@constants/calendarsUI';

export type RsvpStatus = 'going' | 'maybe' | 'not_going';

const CONFIGS: Record<RsvpStatus, { label: string; bg: string; color: string; border: string }> = {
  going: {
    label: 'Going',
    bg: calendarsUIColors.primaryLight,
    color: '#0A8F4F',
    border: calendarsUIColors.primaryBorder,
  },
  maybe: { label: 'Maybe', bg: '#FFF8EB', color: '#B8860B', border: '#FFE4A0' },
  not_going: {
    label: 'Not Going',
    bg: calendarsUIColors.dangerLight,
    color: '#CC4444',
    border: '#FFD4D4',
  },
};

interface RsvpBadgeProps {
  status: RsvpStatus | null | undefined;
}

export function RsvpBadge({ status }: RsvpBadgeProps) {
  if (!status) return null;
  const c = CONFIGS[status];
  if (!c) return null;
  return (
    <View style={[styles.badge, { backgroundColor: c.bg, borderColor: c.border }]}>
      <RNText style={[styles.label, { color: c.color }]}>{c.label}</RNText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  label: { fontSize: 11, fontWeight: '600', letterSpacing: 0.2 },
});
```

Create `nebbler/src/components/calendars/__tests__/RsvpBadge.test.tsx`:

```tsx
import { render } from '@testing-library/react-native';
import { RsvpBadge } from '../RsvpBadge';

describe('RsvpBadge', () => {
  it('renders Going label', () => {
    const { getByText } = render(<RsvpBadge status="going" />);
    expect(getByText('Going')).toBeTruthy();
  });
  it('renders Not Going label', () => {
    const { getByText } = render(<RsvpBadge status="not_going" />);
    expect(getByText('Not Going')).toBeTruthy();
  });
  it('returns null for null status', () => {
    const { toJSON } = render(<RsvpBadge status={null} />);
    expect(toJSON()).toBeNull();
  });
});
```

- [ ] **Step 3: Write `RoleBadge` and its test**

Create `nebbler/src/components/calendars/RoleBadge.tsx`:

```tsx
import { StyleSheet, Text as RNText, View } from 'react-native';
import { calendarsUIColors } from '@constants/calendarsUI';

export type CalendarRole = 'owner' | 'admin' | 'member';

const CONFIGS: Record<CalendarRole, { label: string; bg: string; color: string; border: string }> =
  {
    owner: {
      label: 'Owner',
      bg: calendarsUIColors.primaryLight,
      color: '#0A8F4F',
      border: calendarsUIColors.primaryBorder,
    },
    admin: { label: 'Admin', bg: '#EDE9FE', color: '#7C3AED', border: '#DDD6FE' },
    member: {
      label: 'Member',
      bg: calendarsUIColors.surfaceHover,
      color: calendarsUIColors.textSecondary,
      border: calendarsUIColors.border,
    },
  };

interface RoleBadgeProps {
  role: CalendarRole | string;
}

export function RoleBadge({ role }: RoleBadgeProps) {
  const c = (CONFIGS as Record<string, (typeof CONFIGS)[CalendarRole]>)[role] ?? CONFIGS.member;
  return (
    <View style={[styles.badge, { backgroundColor: c.bg, borderColor: c.border }]}>
      <RNText style={[styles.label, { color: c.color }]}>{c.label}</RNText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  label: { fontSize: 11, fontWeight: '600', letterSpacing: 0.2 },
});
```

Create `nebbler/src/components/calendars/__tests__/RoleBadge.test.tsx`:

```tsx
import { render } from '@testing-library/react-native';
import { RoleBadge } from '../RoleBadge';

describe('RoleBadge', () => {
  it.each(['owner', 'admin', 'member'] as const)('renders %s', (role) => {
    const { getByText } = render(<RoleBadge role={role} />);
    expect(getByText(role.charAt(0).toUpperCase() + role.slice(1))).toBeTruthy();
  });
});
```

- [ ] **Step 4: Write `EventRow` and its test**

Create `nebbler/src/components/calendars/EventRow.tsx`:

```tsx
import { StyleSheet, Text as RNText, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Pressable } from '@/components/ui/pressable';
import { calendarsUIColors } from '@constants/calendarsUI';
import { formatTimeRange, formatEventDateTime } from '@utils/formatTime';
import { RsvpBadge, type RsvpStatus } from './RsvpBadge';
import type { Event } from '@database/schema';

interface EventRowProps {
  event: Event;
  calendarColor: string;
  isFreeBusy: boolean;
  rsvpStatus?: RsvpStatus | null;
  goingCount?: number;
  onPress?: () => void;
}

function ChevronRight() {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
      <Path
        d="M6 4L10 8L6 12"
        stroke={calendarsUIColors.textMuted}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function EventRow({
  event,
  calendarColor,
  isFreeBusy,
  rsvpStatus,
  goingCount,
  onPress,
}: EventRowProps) {
  const timeText = isFreeBusy
    ? formatEventDateTime(event.start_time!, event.end_time!).replace(/ ·.*/, '')
    : formatEventDateTime(event.start_time!, event.end_time!);
  const title = isFreeBusy ? 'Busy' : (event.title ?? '');

  return (
    <Pressable onPress={onPress} style={styles.row}>
      <View
        style={[
          styles.colorBar,
          { backgroundColor: isFreeBusy ? calendarsUIColors.textMuted : calendarColor },
        ]}
      />
      <View style={styles.info}>
        <RNText numberOfLines={1} style={styles.title}>
          {title}
        </RNText>
        <RNText style={styles.time}>{timeText}</RNText>
      </View>
      {!isFreeBusy && rsvpStatus ? <RsvpBadge status={rsvpStatus} /> : null}
      {!isFreeBusy && goingCount && goingCount > 0 ? (
        <RNText style={styles.goingCount}>{goingCount} going</RNText>
      ) : null}
      <ChevronRight />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: calendarsUIColors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: calendarsUIColors.border,
  },
  colorBar: { width: 4, height: 44, borderRadius: 2 },
  info: { flex: 1, minWidth: 0 },
  title: { fontSize: 15, fontWeight: '600', color: calendarsUIColors.text, marginBottom: 3 },
  time: { fontSize: 13, color: calendarsUIColors.textSecondary },
  goingCount: { fontSize: 12, color: calendarsUIColors.textMuted },
});
```

Create `nebbler/src/components/calendars/__tests__/EventRow.test.tsx`:

```tsx
import { render, fireEvent } from '@testing-library/react-native';
import { EventRow } from '../EventRow';

const ev = {
  id: 'e1',
  calendar_id: 'c1',
  title: 'Game Night',
  start_time: '2026-06-01T19:00:00Z',
  end_time: '2026-06-01T22:00:00Z',
} as any;

describe('EventRow', () => {
  it('shows the event title when not free/busy', () => {
    const { getByText, queryByText } = render(
      <EventRow
        event={ev}
        calendarColor="#A78BFA"
        isFreeBusy={false}
        rsvpStatus="going"
        goingCount={3}
      />
    );
    expect(getByText('Game Night')).toBeTruthy();
    expect(getByText('Going')).toBeTruthy();
    expect(getByText('3 going')).toBeTruthy();
    expect(queryByText('Busy')).toBeNull();
  });

  it('shows Busy and no RSVP when free/busy', () => {
    const { getByText, queryByText } = render(
      <EventRow event={ev} calendarColor="#A78BFA" isFreeBusy rsvpStatus="going" goingCount={5} />
    );
    expect(getByText('Busy')).toBeTruthy();
    expect(queryByText('Game Night')).toBeNull();
    expect(queryByText('Going')).toBeNull();
    expect(queryByText('5 going')).toBeNull();
  });

  it('calls onPress', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <EventRow event={ev} calendarColor="#A78BFA" isFreeBusy={false} onPress={onPress} />
    );
    fireEvent.press(getByText('Game Night'));
    expect(onPress).toHaveBeenCalled();
  });
});
```

- [ ] **Step 5: Write `MemberRow` and its test**

Create `nebbler/src/components/calendars/MemberRow.tsx`:

```tsx
import { StyleSheet, Text as RNText, View } from 'react-native';
import { calendarsUIColors } from '@constants/calendarsUI';
import { RoleBadge, type CalendarRole } from './RoleBadge';
import type { CalendarDetailMember } from '@hooks/useCalendarDetail';

interface MemberRowProps {
  member: CalendarDetailMember;
  calendarColor: string;
}

export function MemberRow({ member, calendarColor }: MemberRowProps) {
  return (
    <View style={styles.row}>
      <View
        style={[
          styles.avatar,
          { backgroundColor: `${calendarColor}20`, borderColor: `${calendarColor}40` },
        ]}
      >
        <RNText style={[styles.avatarLetter, { color: calendarColor }]}>
          {member.avatar_initial}
        </RNText>
      </View>
      <RNText style={styles.name}>{member.display_name}</RNText>
      <RoleBadge role={member.role_name as CalendarRole} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: calendarsUIColors.border,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { fontSize: 14, fontWeight: '700' },
  name: { flex: 1, fontSize: 15, fontWeight: '500', color: calendarsUIColors.text },
});
```

Create `nebbler/src/components/calendars/__tests__/MemberRow.test.tsx`:

```tsx
import { render } from '@testing-library/react-native';
import { MemberRow } from '../MemberRow';

const member = {
  id: 'm1',
  user_id: 'u1',
  role_id: 'r1',
  role_level: 40,
  role_name: 'owner',
  display_name: 'Sarah Chen',
  avatar_initial: 'S',
};

describe('MemberRow', () => {
  it('renders display name and role badge', () => {
    const { getByText } = render(<MemberRow member={member} calendarColor="#A78BFA" />);
    expect(getByText('Sarah Chen')).toBeTruthy();
    expect(getByText('S')).toBeTruthy();
    expect(getByText('Owner')).toBeTruthy();
  });
});
```

- [ ] **Step 6: Write `ToggleRow` and its test**

Create `nebbler/src/components/calendars/ToggleRow.tsx`:

```tsx
import { StyleSheet, Switch, Text as RNText, View } from 'react-native';
import { calendarsUIColors } from '@constants/calendarsUI';

interface ToggleRowProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: string;
}

export function ToggleRow({ checked, onChange, label, description }: ToggleRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <RNText style={styles.label}>{label}</RNText>
        {description ? <RNText style={styles.description}>{description}</RNText> : null}
      </View>
      <Switch
        value={checked}
        onValueChange={onChange}
        trackColor={{ false: calendarsUIColors.border, true: calendarsUIColors.primary }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
    backgroundColor: calendarsUIColors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: calendarsUIColors.border,
  },
  text: { flex: 1 },
  label: { fontSize: 15, fontWeight: '600', color: calendarsUIColors.text },
  description: {
    fontSize: 13,
    color: calendarsUIColors.textSecondary,
    marginTop: 3,
    lineHeight: 18,
  },
});
```

Create `nebbler/src/components/calendars/__tests__/ToggleRow.test.tsx`:

```tsx
import { render, fireEvent } from '@testing-library/react-native';
import { ToggleRow } from '../ToggleRow';

describe('ToggleRow', () => {
  it('calls onChange when toggled', () => {
    const onChange = jest.fn();
    const { UNSAFE_getByType } = render(
      <ToggleRow checked={false} onChange={onChange} label="RSVP Enabled" description="d" />
    );
    const { Switch } = require('react-native');
    fireEvent(UNSAFE_getByType(Switch), 'valueChange', true);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('renders label and description', () => {
    const { getByText } = render(
      <ToggleRow
        checked={true}
        onChange={() => {}}
        label="Show as busy"
        description="counts toward availability"
      />
    );
    expect(getByText('Show as busy')).toBeTruthy();
    expect(getByText('counts toward availability')).toBeTruthy();
  });
});
```

- [ ] **Step 7: Run all component tests**

Run: `cd nebbler && npm run test -- components/calendars/__tests__`
Expected: PASS — all six new test files green.

- [ ] **Step 8: Commit**

```bash
cd nebbler && git add src/components/calendars/CalendarTypeBadge.tsx src/components/calendars/RsvpBadge.tsx src/components/calendars/RoleBadge.tsx src/components/calendars/EventRow.tsx src/components/calendars/MemberRow.tsx src/components/calendars/ToggleRow.tsx src/components/calendars/__tests__/
git commit -m "feat(calendar-detail): add shared badge/row/toggle primitives"
```

---

## Task 3: `DeleteCalendarConfirmModal` Component

**Goal:** Modal that asks "Delete {Calendar Name}?" with body copy and Cancel / Delete actions.

**Files:**

- Create: `nebbler/src/components/calendars/DeleteCalendarConfirmModal.tsx`
- Create: `nebbler/src/components/calendars/__tests__/DeleteCalendarConfirmModal.test.tsx`

**Acceptance Criteria:**

- [ ] Accepts `{ visible, calendarName, onCancel, onConfirm }`
- [ ] When `visible` is false, renders nothing
- [ ] Title: `Delete {Calendar Name}?`
- [ ] Body: `This will remove all events and members. This can't be undone.`
- [ ] Cancel button calls `onCancel`; Delete (red) button calls `onConfirm`
- [ ] Built on RN `Modal` with `transparent` + dimmed backdrop

**Verify:** `npm run test -- DeleteCalendarConfirmModal` → PASS.

**Steps:**

- [ ] **Step 1: Write failing test**

Create `nebbler/src/components/calendars/__tests__/DeleteCalendarConfirmModal.test.tsx`:

```tsx
import { render, fireEvent } from '@testing-library/react-native';
import { DeleteCalendarConfirmModal } from '../DeleteCalendarConfirmModal';

describe('DeleteCalendarConfirmModal', () => {
  it('returns null when not visible', () => {
    const { queryByText } = render(
      <DeleteCalendarConfirmModal
        visible={false}
        calendarName="X"
        onCancel={jest.fn()}
        onConfirm={jest.fn()}
      />
    );
    expect(queryByText(/Delete/)).toBeNull();
  });

  it('renders calendar name in the title', () => {
    const { getByText } = render(
      <DeleteCalendarConfirmModal
        visible
        calendarName="Game Night"
        onCancel={jest.fn()}
        onConfirm={jest.fn()}
      />
    );
    expect(getByText('Delete Game Night?')).toBeTruthy();
  });

  it('calls onCancel and onConfirm', () => {
    const onCancel = jest.fn();
    const onConfirm = jest.fn();
    const { getByText } = render(
      <DeleteCalendarConfirmModal
        visible
        calendarName="X"
        onCancel={onCancel}
        onConfirm={onConfirm}
      />
    );
    fireEvent.press(getByText('Cancel'));
    expect(onCancel).toHaveBeenCalled();
    fireEvent.press(getByText('Delete'));
    expect(onConfirm).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run to confirm failure**

Run: `cd nebbler && npm run test -- DeleteCalendarConfirmModal` → FAIL (module not found).

- [ ] **Step 3: Implement**

Create `nebbler/src/components/calendars/DeleteCalendarConfirmModal.tsx`:

```tsx
import { Modal, Pressable, StyleSheet, Text as RNText, View } from 'react-native';
import { calendarsUIColors } from '@constants/calendarsUI';

interface Props {
  visible: boolean;
  calendarName: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteCalendarConfirmModal({ visible, calendarName, onCancel, onConfirm }: Props) {
  if (!visible) return null;
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <RNText style={styles.title}>Delete {calendarName}?</RNText>
          <RNText style={styles.body}>
            This will remove all events and members. This can't be undone.
          </RNText>
          <View style={styles.actions}>
            <Pressable style={[styles.btn, styles.cancelBtn]} onPress={onCancel}>
              <RNText style={styles.cancelText}>Cancel</RNText>
            </Pressable>
            <Pressable style={[styles.btn, styles.deleteBtn]} onPress={onConfirm}>
              <RNText style={styles.deleteText}>Delete</RNText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: calendarsUIColors.surface,
    borderRadius: 20,
    padding: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: calendarsUIColors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    color: calendarsUIColors.textSecondary,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 20,
  },
  actions: { flexDirection: 'row', gap: 10 },
  btn: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: calendarsUIColors.surfaceHover,
    borderWidth: 1,
    borderColor: calendarsUIColors.border,
  },
  cancelText: { fontSize: 15, fontWeight: '600', color: calendarsUIColors.text },
  deleteBtn: { backgroundColor: calendarsUIColors.danger },
  deleteText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});
```

- [ ] **Step 4: Run tests**

Run: `cd nebbler && npm run test -- DeleteCalendarConfirmModal` → PASS.

- [ ] **Step 5: Commit**

```bash
cd nebbler && git add src/components/calendars/DeleteCalendarConfirmModal.tsx src/components/calendars/__tests__/DeleteCalendarConfirmModal.test.tsx
git commit -m "feat(calendar-detail): add delete confirmation modal"
```

---

## Task 4: `UpdateCalendarSchema` (Zod)

**Goal:** Reusable Zod schema for the edit-mode form. Mirrors the existing `CreateCalendarSchema` shape but allows partial updates (all fields optional except `name` which must be non-empty if present).

**Files:**

- Create: `nebbler/src/database/schemas/updateCalendarSchema.ts`
- Create: `nebbler/src/database/schemas/__tests__/updateCalendarSchema.test.ts`
- Modify: `nebbler/src/database/schemas/index.ts`

**Acceptance Criteria:**

- [ ] `UpdateCalendarSchema` validates `{ name, description?, color?, rsvpEnabled?, discoverable?, affectsAvailability? }`
- [ ] `name` is required, trimmed, 1–100 chars
- [ ] `description` optional, max 500 chars, allows empty string (cleared description)
- [ ] `color` matches `/^#[0-9A-Fa-f]{6}$/`
- [ ] Booleans pass through unchanged
- [ ] Schema is re-exported from `nebbler/src/database/schemas/index.ts`
- [ ] Tests cover: valid full payload, missing-name failure, empty-name failure, oversize description failure, bad color regex failure

**Verify:** `npm run test -- updateCalendarSchema` → PASS.

**Steps:**

- [ ] **Step 1: Write failing tests**

Create `nebbler/src/database/schemas/__tests__/updateCalendarSchema.test.ts`:

```ts
import { UpdateCalendarSchema } from '../updateCalendarSchema';

describe('UpdateCalendarSchema', () => {
  it('accepts a full valid payload', () => {
    const parsed = UpdateCalendarSchema.parse({
      name: 'Game Night',
      description: 'Weekly',
      color: '#A78BFA',
      rsvpEnabled: true,
      discoverable: false,
      affectsAvailability: true,
    });
    expect(parsed.name).toBe('Game Night');
  });

  it('rejects empty name', () => {
    expect(() => UpdateCalendarSchema.parse({ name: '' })).toThrow();
    expect(() => UpdateCalendarSchema.parse({ name: '   ' })).toThrow();
  });

  it('rejects name over 100 chars', () => {
    expect(() => UpdateCalendarSchema.parse({ name: 'x'.repeat(101) })).toThrow();
  });

  it('rejects bad color hex', () => {
    expect(() => UpdateCalendarSchema.parse({ name: 'x', color: 'not-a-color' })).toThrow();
  });

  it('rejects description over 500 chars', () => {
    expect(() => UpdateCalendarSchema.parse({ name: 'x', description: 'y'.repeat(501) })).toThrow();
  });

  it('accepts empty description string', () => {
    const parsed = UpdateCalendarSchema.parse({ name: 'x', description: '' });
    expect(parsed.description).toBe('');
  });
});
```

- [ ] **Step 2: Run to confirm failure**

Run: `cd nebbler && npm run test -- updateCalendarSchema` → FAIL (module not found).

- [ ] **Step 3: Implement**

Create `nebbler/src/database/schemas/updateCalendarSchema.ts`:

```ts
import { z } from 'zod';

export const UpdateCalendarSchema = z.object({
  name: z.string().trim().min(1, 'Calendar name is required').max(100, 'Name is too long'),
  description: z.string().max(500, 'Description is too long').optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color')
    .optional(),
  rsvpEnabled: z.boolean().optional(),
  discoverable: z.boolean().optional(),
  affectsAvailability: z.boolean().optional(),
});

export type UpdateCalendarFormData = z.infer<typeof UpdateCalendarSchema>;
```

- [ ] **Step 4: Re-export from index**

Edit `nebbler/src/database/schemas/index.ts` — append:

```ts
export { UpdateCalendarSchema, type UpdateCalendarFormData } from './updateCalendarSchema';
```

- [ ] **Step 5: Run tests**

Run: `cd nebbler && npm run test -- updateCalendarSchema` → PASS, 6 tests.

- [ ] **Step 6: Commit**

```bash
cd nebbler && git add src/database/schemas/updateCalendarSchema.ts src/database/schemas/__tests__/updateCalendarSchema.test.ts src/database/schemas/index.ts
git commit -m "feat(calendar-detail): add UpdateCalendarSchema for edit-mode form"
```

---

## Task 5: `CalendarDetailScreen` — View Mode

**Goal:** Implement the screen with view mode only. Header (back + title + edit pencil if permitted), calendar header card, upcoming events list (with empty state), members section (hidden for private; inline-expandable for social/public), and FAB. Edit mode rendering is the next task.

**Files:**

- Modify: `nebbler/src/screens/CalendarDetailScreen.tsx` (full rewrite of the 16-line stub)
- Create: `nebbler/src/screens/__tests__/CalendarDetailScreen.test.tsx` (skeleton, expanded in later tasks)

**Acceptance Criteria:**

- [ ] Header shows calendar name as the native-stack title via `navigation.setOptions`
- [ ] Header left = back button (circular surface-hover, custom svg), header right = edit pencil only when `permissions.canEnterEdit` is true
- [ ] Calendar header card renders 56pt color tile (color = `calendar.color` from palette), first letter of name, type badge tinted with color, owner row, description bubble when present
- [ ] Member count text/link shown for social/public, hidden for private
- [ ] Upcoming events rendered via `EventRow`; empty list shows inline `"No upcoming events."` placeholder
- [ ] Tapping an `EventRow` calls `navigation.navigate('EventDetail', { eventId })`
- [ ] When `permissions.isFreeBusy`, `EventRow` is rendered with `isFreeBusy` and the FAB is hidden
- [ ] Members section hidden for private calendar; for social/public, collapsed by default with stacked avatars + count; tap to expand → full `MemberRow` list + an "Invite Members" pill (stub press logs and is wired later to push CalendarMembersScreen — for MVP route does not yet exist, so the button is rendered but `onPress` is a no-op `// TODO: navigate to CalendarMembersScreen when route is registered (NEB-64)` comment is acceptable)
- [ ] FAB visible when `permissions.canCreateEvent`; tap → `navigation.navigate('CreateEvent')` (route does not yet accept a calendarId param; mockup pre-selection deferred — leave a `// TODO: NEB-62 — once CreateEvent accepts { calendarId }, pass it here.` comment)
- [ ] FAB background color = `calendar.color`

**Verify:** `npm run test -- CalendarDetailScreen` (view-mode tests only) → PASS. Also `npm run typecheck`.

**Steps:**

- [ ] **Step 1: Write failing view-mode tests**

Create `nebbler/src/screens/__tests__/CalendarDetailScreen.test.tsx`:

```tsx
import { render, fireEvent } from '@testing-library/react-native';

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockSetOptions = jest.fn();
let routeParams: { calendarId: string } = { calendarId: 'cal-1' };

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
    setOptions: mockSetOptions,
    replace: jest.fn(),
  }),
  useRoute: () => ({ params: routeParams }),
}));

let mockDetail: any;
jest.mock('@hooks/useCalendarDetail', () => ({
  useCalendarDetail: () => mockDetail,
}));

jest.mock('@hooks/useCalendars', () => ({
  useCalendarMutations: () => ({ updateCalendar: jest.fn(), deleteCalendar: jest.fn() }),
}));

const { CalendarDetailScreen } = require('../CalendarDetailScreen');

const baseCalendar = {
  id: 'cal-1',
  owner_id: 'u1',
  type: 'social',
  name: 'Game Night',
  description: 'Weekly game night.',
  color: '#A78BFA',
  rsvp_enabled: 1,
  discoverable: 0,
  default_view_mode: 'full',
  household_sharing: 1,
  affects_availability: 1,
  deleted_at: null,
};

function detail(overrides: Partial<any> = {}) {
  return {
    calendar: baseCalendar,
    ownerName: 'Sarah',
    currentMembership: { role_level: 40, role_name: 'owner' },
    members: [
      {
        id: 'm1',
        user_id: 'u1',
        role_id: 'r1',
        role_level: 40,
        role_name: 'owner',
        display_name: 'Sarah',
        avatar_initial: 'S',
      },
    ],
    upcomingEvents: [
      {
        id: 'e1',
        calendar_id: 'cal-1',
        title: 'Catan',
        start_time: '2099-01-01T19:00:00Z',
        end_time: '2099-01-01T22:00:00Z',
      },
    ],
    effectiveViewMode: 'full',
    permissions: {
      canView: true,
      canEnterEdit: true,
      canSave: true,
      canDelete: true,
      canCreateEvent: true,
      isFreeBusy: false,
    },
    isLoading: false,
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  routeParams = { calendarId: 'cal-1' };
});

describe('CalendarDetailScreen — view mode', () => {
  it('renders calendar name and description', () => {
    mockDetail = detail();
    const { getByText } = render(<CalendarDetailScreen />);
    expect(getByText('Game Night')).toBeTruthy();
    expect(getByText('Weekly game night.')).toBeTruthy();
  });

  it('renders upcoming events', () => {
    mockDetail = detail();
    const { getByText } = render(<CalendarDetailScreen />);
    expect(getByText('Catan')).toBeTruthy();
  });

  it('shows empty events placeholder when list is empty', () => {
    mockDetail = detail({ upcomingEvents: [] });
    const { getByText } = render(<CalendarDetailScreen />);
    expect(getByText('No upcoming events.')).toBeTruthy();
  });

  it('hides members section for private calendars', () => {
    mockDetail = detail({ calendar: { ...baseCalendar, type: 'private' } });
    const { queryByText } = render(<CalendarDetailScreen />);
    expect(queryByText(/members/i)).toBeNull();
  });

  it('renders Busy + hides FAB when isFreeBusy', () => {
    mockDetail = detail({
      effectiveViewMode: 'free_busy',
      permissions: {
        canView: true,
        canEnterEdit: false,
        canSave: false,
        canDelete: false,
        canCreateEvent: false,
        isFreeBusy: true,
      },
    });
    const { getByText, queryByTestId } = render(<CalendarDetailScreen />);
    expect(getByText('Busy')).toBeTruthy();
    expect(queryByTestId('add-event-fab')).toBeNull();
  });

  it('navigates to EventDetail on event press', () => {
    mockDetail = detail();
    const { getByText } = render(<CalendarDetailScreen />);
    fireEvent.press(getByText('Catan'));
    expect(mockNavigate).toHaveBeenCalledWith('EventDetail', { eventId: 'e1' });
  });
});
```

- [ ] **Step 2: Run to confirm failure**

Run: `cd nebbler && npm run test -- CalendarDetailScreen` → FAIL (stub screen has no UI).

- [ ] **Step 3: Implement view-mode screen**

Replace `nebbler/src/screens/CalendarDetailScreen.tsx`:

```tsx
import { useCallback, useEffect, useState } from 'react';
import {
  Pressable as RNPressable,
  ScrollView,
  StyleSheet,
  Text as RNText,
  View,
} from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { tva } from '@gluestack-ui/utils/nativewind-utils';
import Svg, { Path } from 'react-native-svg';
import { calendarsUIColors } from '@constants/calendarsUI';
import { useCalendarDetail } from '@hooks/useCalendarDetail';
import { CalendarTypeBadge } from '@components/calendars/CalendarTypeBadge';
import { EventRow } from '@components/calendars/EventRow';
import { MemberRow } from '@components/calendars/MemberRow';
import type { RootStackParamList } from '@navigation/types';

const containerStyle = tva({ base: 'flex-1 bg-background-0' });
type Nav = NativeStackNavigationProp<RootStackParamList>;
type Rt = RouteProp<RootStackParamList, 'CalendarDetail'>;

function BackIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Path
        d="M13 4L7 10L13 16"
        stroke={calendarsUIColors.text}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
function EditIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Path
        d="M14.5 3.5L16.5 5.5L6 16H4V14L14.5 3.5Z"
        stroke={calendarsUIColors.text}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <Path
        d="M12.5 5.5L14.5 7.5"
        stroke={calendarsUIColors.text}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </Svg>
  );
}
function PlusIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 20 20" fill="none">
      <Path d="M10 4V16M4 10H16" stroke="#FFFFFF" strokeWidth={2.2} strokeLinecap="round" />
    </Svg>
  );
}
function ChevronRight() {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
      <Path
        d="M6 4L10 8L6 12"
        stroke={calendarsUIColors.textMuted}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function CalendarDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const calendarId = route.params.calendarId;

  const { calendar, ownerName, members, upcomingEvents, permissions } =
    useCalendarDetail(calendarId);
  const [membersExpanded, setMembersExpanded] = useState(false);

  // Header
  useEffect(() => {
    if (!calendar) return;
    navigation.setOptions({
      title: calendar.name ?? '',
      headerTitleStyle: { fontSize: 17, fontWeight: '700' },
      headerLeft: () => (
        <RNPressable onPress={() => navigation.goBack()} hitSlop={8} style={styles.headerBtn}>
          <BackIcon />
        </RNPressable>
      ),
      headerRight: () =>
        permissions.canEnterEdit ? (
          <RNPressable
            onPress={() => navigation.setParams({ mode: 'edit' } as any)}
            hitSlop={8}
            style={styles.headerBtn}
            testID="enter-edit-btn"
          >
            <EditIcon />
          </RNPressable>
        ) : null,
    });
  }, [navigation, calendar, permissions.canEnterEdit]);

  if (!calendar) return <View />;

  const color = calendar.color ?? calendarsUIColors.primary;
  const firstLetter = (calendar.name ?? '?').charAt(0).toUpperCase();
  const isPrivate = calendar.type === 'private';

  return (
    <View className={containerStyle({})} style={styles.flex}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header card */}
        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
            <View
              style={[styles.tile, { backgroundColor: `${color}14`, borderColor: `${color}30` }]}
            >
              <RNText style={[styles.tileLetter, { color }]}>{firstLetter}</RNText>
            </View>
            <View style={styles.headerInfo}>
              <RNText style={styles.headerName}>{calendar.name}</RNText>
              <CalendarTypeBadge type={calendar.type ?? 'private'} color={color} />
            </View>
          </View>
          <View style={styles.metaRow}>
            <RNText style={styles.metaText}>
              <RNText style={styles.metaOwnerName}>{ownerName || 'You'}</RNText>
              {'  · Owner'}
            </RNText>
            {!isPrivate && (
              <RNPressable onPress={() => setMembersExpanded((s) => !s)}>
                <RNText style={styles.metaLink}>{members.length} members</RNText>
              </RNPressable>
            )}
          </View>
          {calendar.description ? (
            <View style={styles.descriptionBubble}>
              <RNText style={styles.descriptionText}>{calendar.description}</RNText>
            </View>
          ) : null}
        </View>

        {/* Upcoming events */}
        <RNText style={styles.sectionLabel}>UPCOMING EVENTS ({upcomingEvents.length})</RNText>
        {upcomingEvents.length === 0 ? (
          <View style={styles.emptyEvents}>
            <RNText style={styles.emptyEventsText}>No upcoming events.</RNText>
          </View>
        ) : (
          <View style={styles.eventList}>
            {upcomingEvents.map((event) => (
              <EventRow
                key={event.id}
                event={event}
                calendarColor={color}
                isFreeBusy={permissions.isFreeBusy}
                onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
              />
            ))}
          </View>
        )}

        {/* Members (social/public only) */}
        {!isPrivate && (
          <>
            <RNText style={styles.sectionLabel}>MEMBERS</RNText>
            <View style={styles.membersCard}>
              <RNPressable
                onPress={() => setMembersExpanded((s) => !s)}
                style={styles.membersHeader}
              >
                <View style={styles.membersHeaderLeft}>
                  <View style={styles.stackedAvatars}>
                    {members.slice(0, 3).map((m, i) => (
                      <View
                        key={m.id}
                        style={[
                          styles.stackedAvatar,
                          {
                            backgroundColor: `${color}20`,
                            marginLeft: i > 0 ? -8 : 0,
                            zIndex: 3 - i,
                          },
                        ]}
                      >
                        <RNText style={[styles.stackedAvatarText, { color }]}>
                          {m.avatar_initial}
                        </RNText>
                      </View>
                    ))}
                  </View>
                  <RNText style={styles.membersHeaderLabel}>{members.length} members</RNText>
                </View>
                <View style={{ transform: [{ rotate: membersExpanded ? '90deg' : '0deg' }] }}>
                  <ChevronRight />
                </View>
              </RNPressable>
              {membersExpanded && (
                <>
                  {members.map((m) => (
                    <MemberRow key={m.id} member={m} calendarColor={color} />
                  ))}
                  <RNPressable
                    style={styles.inviteBtn}
                    // TODO: NEB-64 — push CalendarMembersScreen for invite flow.
                    onPress={() => {}}
                  >
                    <RNText style={styles.inviteText}>+ Invite Members</RNText>
                  </RNPressable>
                </>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {permissions.canCreateEvent && (
        <RNPressable
          testID="add-event-fab"
          // TODO: NEB-62 — pass { calendarId } once CreateEvent accepts the param.
          onPress={() => navigation.navigate('CreateEvent')}
          style={[
            styles.fab,
            {
              backgroundColor: color,
              shadowColor: color,
            },
          ]}
        >
          <PlusIcon />
        </RNPressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { paddingBottom: 120 },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: calendarsUIColors.surfaceHover,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCard: {
    padding: 16,
    paddingTop: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: calendarsUIColors.border,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 },
  tile: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileLetter: { fontSize: 26, fontWeight: '700' },
  headerInfo: { flex: 1, gap: 6 },
  headerName: {
    fontSize: 22,
    fontWeight: '700',
    color: calendarsUIColors.text,
    letterSpacing: -0.4,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  metaText: { fontSize: 14, color: calendarsUIColors.textSecondary },
  metaOwnerName: { fontWeight: '600', color: calendarsUIColors.text },
  metaLink: { fontSize: 14, fontWeight: '600', color: calendarsUIColors.primary },
  descriptionBubble: {
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: calendarsUIColors.surfaceHover,
    borderRadius: 12,
  },
  descriptionText: { fontSize: 14, color: calendarsUIColors.textSecondary, lineHeight: 21 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: calendarsUIColors.textMuted,
    letterSpacing: 0.3,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  eventList: {
    marginHorizontal: 16,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: calendarsUIColors.border,
  },
  emptyEvents: {
    marginHorizontal: 16,
    padding: 24,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: calendarsUIColors.border,
    backgroundColor: calendarsUIColors.surface,
    alignItems: 'center',
  },
  emptyEventsText: { fontSize: 14, color: calendarsUIColors.textMuted, fontStyle: 'italic' },
  membersCard: {
    marginHorizontal: 16,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: calendarsUIColors.border,
    backgroundColor: calendarsUIColors.surface,
  },
  membersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  membersHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stackedAvatars: { flexDirection: 'row' },
  stackedAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stackedAvatarText: { fontSize: 11, fontWeight: '700' },
  membersHeaderLabel: { fontSize: 15, fontWeight: '500', color: calendarsUIColors.text },
  inviteBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    backgroundColor: calendarsUIColors.primaryLight,
  },
  inviteText: { fontSize: 14, fontWeight: '600', color: calendarsUIColors.primary },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 32,
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
});
```

- [ ] **Step 4: Run tests + typecheck**

```bash
cd nebbler && npm run test -- CalendarDetailScreen
cd nebbler && npm run typecheck
```

Expected: all 6 view-mode tests PASS; typecheck PASS.

- [ ] **Step 5: Commit**

```bash
cd nebbler && git add src/screens/CalendarDetailScreen.tsx src/screens/__tests__/CalendarDetailScreen.test.tsx
git commit -m "feat(calendar-detail): implement view mode (NEB-62)"
```

---

## Task 6: `CalendarDetailScreen` — Edit Mode

**Goal:** Add an in-screen `mode` state (`'view' | 'edit'`) toggled by the header pencil. Edit mode shows: header X + Save button, preview card, name input, description textarea, color swatches, settings toggles (RSVP / Discoverable [public only] / Show as busy), and the danger zone (owner only).

**Files:**

- Modify: `nebbler/src/screens/CalendarDetailScreen.tsx`
- Modify: `nebbler/src/screens/__tests__/CalendarDetailScreen.test.tsx`

**Acceptance Criteria:**

- [ ] Tapping the edit pencil sets `mode === 'edit'` and the header morphs: left → Close (X), title → "Edit Calendar", right → green Save button (disabled when name is empty/whitespace)
- [ ] Edit body renders: preview card (live), name input (required), description textarea, color picker (12 swatches from `CALENDAR_PALETTE`), settings toggles section, danger zone
- [ ] Discoverable toggle visible only when `calendar.type === 'public'`
- [ ] Danger zone visible only when `permissions.canDelete`
- [ ] Close (X) reverts to view mode without persisting
- [ ] Save is disabled while name is empty
- [ ] Test: edit mode renders all 12 swatches; discoverable hidden for social; danger zone hidden for non-owner; tapping X returns to view mode

**Verify:** `npm run test -- CalendarDetailScreen` (all tests) → PASS. `npm run typecheck`.

**Steps:**

- [ ] **Step 1: Append failing edit-mode tests**

Append to `nebbler/src/screens/__tests__/CalendarDetailScreen.test.tsx`:

```tsx
import { fireEvent as fe } from '@testing-library/react-native';

describe('CalendarDetailScreen — edit mode', () => {
  it('enters edit mode when pencil pressed', () => {
    mockDetail = detail();
    const { getByTestId, getByText } = render(<CalendarDetailScreen />);
    // header pencil is rendered via setOptions; we use the same testID by exposing
    // an in-body edit entry for tests when needed. For now, simulate by re-rendering
    // with mode=edit via the screen's state — see implementation note: edit entry
    // is also exposed via testID 'enter-edit-btn-inline' for testability.
    fe.press(getByTestId('enter-edit-btn-inline'));
    expect(getByText('Edit Calendar')).toBeTruthy();
  });

  it('hides Discoverable toggle for social calendars', () => {
    mockDetail = detail({ calendar: { ...baseCalendar, type: 'social' } });
    const { getByTestId, queryByText } = render(<CalendarDetailScreen />);
    fe.press(getByTestId('enter-edit-btn-inline'));
    expect(queryByText('Discoverable')).toBeNull();
  });

  it('shows Discoverable toggle for public calendars', () => {
    mockDetail = detail({ calendar: { ...baseCalendar, type: 'public' } });
    const { getByTestId, getByText } = render(<CalendarDetailScreen />);
    fe.press(getByTestId('enter-edit-btn-inline'));
    expect(getByText('Discoverable')).toBeTruthy();
  });

  it('hides Danger Zone for non-owner', () => {
    mockDetail = detail({
      permissions: {
        canView: true,
        canEnterEdit: true,
        canSave: true,
        canDelete: false,
        canCreateEvent: true,
        isFreeBusy: false,
      },
    });
    const { getByTestId, queryByText } = render(<CalendarDetailScreen />);
    fe.press(getByTestId('enter-edit-btn-inline'));
    expect(queryByText('Delete Calendar')).toBeNull();
  });

  it('returns to view mode on X press', () => {
    mockDetail = detail();
    const { getByTestId, queryByText, getByText } = render(<CalendarDetailScreen />);
    fe.press(getByTestId('enter-edit-btn-inline'));
    expect(getByText('Edit Calendar')).toBeTruthy();
    fe.press(getByTestId('close-edit-btn'));
    expect(queryByText('Edit Calendar')).toBeNull();
  });
});
```

- [ ] **Step 2: Run to confirm failure**

Run: `cd nebbler && npm run test -- CalendarDetailScreen` → 5 new tests FAIL.

- [ ] **Step 3: Update screen with edit mode**

Edit `nebbler/src/screens/CalendarDetailScreen.tsx`:

1. Import additions at the top:

```tsx
import { TextInput } from 'react-native';
import { CALENDAR_PALETTE } from '@constants/calendarsUI';
import { ToggleRow } from '@components/calendars/ToggleRow';
import { DeleteCalendarConfirmModal } from '@components/calendars/DeleteCalendarConfirmModal';
```

2. Inside `CalendarDetailScreen`, add state (above the existing `membersExpanded` state):

```tsx
const [mode, setMode] = useState<'view' | 'edit'>('view');
const [editName, setEditName] = useState('');
const [editDescription, setEditDescription] = useState('');
const [editColor, setEditColor] = useState<string>('');
const [editRsvp, setEditRsvp] = useState(false);
const [editDiscoverable, setEditDiscoverable] = useState(false);
const [editAffectsAvailability, setEditAffectsAvailability] = useState(true);
const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

// Sync edit state from the calendar whenever entering edit mode
const enterEditMode = useCallback(() => {
  if (!calendar) return;
  setEditName(calendar.name ?? '');
  setEditDescription(calendar.description ?? '');
  setEditColor(calendar.color ?? CALENDAR_PALETTE[0].hex);
  setEditRsvp(calendar.rsvp_enabled === 1);
  setEditDiscoverable(calendar.discoverable === 1);
  setEditAffectsAvailability(calendar.affects_availability !== 0);
  setMode('edit');
}, [calendar]);

const exitEditMode = useCallback(() => {
  setMode('view');
}, []);

const canSaveName = editName.trim().length > 0;
```

3. Replace the existing `useEffect` for header with one that branches by mode:

```tsx
useEffect(() => {
  if (!calendar) return;
  if (mode === 'view') {
    navigation.setOptions({
      title: calendar.name ?? '',
      headerTitleStyle: { fontSize: 17, fontWeight: '700' },
      headerLeft: () => (
        <RNPressable onPress={() => navigation.goBack()} hitSlop={8} style={styles.headerBtn}>
          <BackIcon />
        </RNPressable>
      ),
      headerRight: () =>
        permissions.canEnterEdit ? (
          <RNPressable
            onPress={enterEditMode}
            hitSlop={8}
            style={styles.headerBtn}
            testID="enter-edit-btn"
          >
            <EditIcon />
          </RNPressable>
        ) : null,
    });
  } else {
    navigation.setOptions({
      title: 'Edit Calendar',
      headerTitleStyle: { fontSize: 17, fontWeight: '700' },
      headerLeft: () => (
        <RNPressable
          onPress={exitEditMode}
          hitSlop={8}
          style={styles.headerBtn}
          testID="close-edit-btn"
        >
          <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
            <Path
              d="M5 5L15 15M15 5L5 15"
              stroke={calendarsUIColors.text}
              strokeWidth={2}
              strokeLinecap="round"
            />
          </Svg>
        </RNPressable>
      ),
      headerRight: () => (
        <RNPressable
          onPress={() => {
            /* save wired in Task 7 */
          }}
          disabled={!canSaveName}
          hitSlop={8}
          testID="save-edit-btn"
          style={[
            styles.headerSave,
            {
              backgroundColor: canSaveName
                ? calendarsUIColors.primary
                : calendarsUIColors.surfaceHover,
              opacity: canSaveName ? 1 : 0.7,
            },
          ]}
        >
          <RNText
            style={[
              styles.headerSaveText,
              { color: canSaveName ? '#FFFFFF' : calendarsUIColors.textMuted },
            ]}
          >
            Save
          </RNText>
        </RNPressable>
      ),
    });
  }
}, [
  navigation,
  calendar,
  mode,
  permissions.canEnterEdit,
  enterEditMode,
  exitEditMode,
  canSaveName,
]);
```

4. Below the existing view-mode JSX (but still inside the outer `View`), gate the entire ScrollView body and FAB on `mode === 'view'`, and render an edit-mode body branch:

```tsx
{mode === 'view' ? (
  /* existing ScrollView content from Task 5 */
) : (
  <ScrollView contentContainerStyle={styles.scroll}>
    <View style={styles.editBody}>
      {/* Preview Card */}
      <View style={styles.previewCard}>
        <View style={[styles.previewTile, { backgroundColor: `${editColor}14`, borderColor: `${editColor}30` }]}>
          <RNText style={[styles.previewLetter, { color: editColor }]}>
            {(editName.trim()[0] ?? '?').toUpperCase()}
          </RNText>
        </View>
        <View>
          <RNText style={[styles.previewName, { color: editName.trim() ? calendarsUIColors.text : calendarsUIColors.textMuted }]}>
            {editName.trim() || 'Calendar name'}
          </RNText>
          <RNText style={styles.previewType}>{calendar.type} calendar</RNText>
        </View>
      </View>

      {/* Name */}
      <RNText style={styles.sectionLabel}>NAME</RNText>
      <TextInput
        value={editName}
        onChangeText={setEditName}
        placeholder="Calendar name"
        placeholderTextColor={calendarsUIColors.textMuted}
        style={styles.textInput}
        maxLength={100}
      />

      {/* Description */}
      <RNText style={styles.sectionLabel}>DESCRIPTION</RNText>
      <TextInput
        value={editDescription}
        onChangeText={setEditDescription}
        placeholder="What's this calendar for?"
        placeholderTextColor={calendarsUIColors.textMuted}
        style={[styles.textInput, styles.textArea]}
        multiline
        numberOfLines={3}
        maxLength={500}
      />

      {/* Color */}
      <RNText style={styles.sectionLabel}>COLOR</RNText>
      <View style={styles.swatchRow}>
        {CALENDAR_PALETTE.map((c) => (
          <RNPressable
            key={c.hex}
            onPress={() => setEditColor(c.hex)}
            testID={`swatch-${c.hex}`}
            style={[
              styles.swatch,
              { backgroundColor: c.hex },
              editColor === c.hex && styles.swatchSelected,
            ]}
          />
        ))}
      </View>

      {/* Settings */}
      <RNText style={styles.sectionLabel}>SETTINGS</RNText>
      <View style={{ gap: 8 }}>
        <ToggleRow
          checked={editRsvp}
          onChange={setEditRsvp}
          label="RSVP Enabled"
          description="Members can respond Going, Maybe, or Not Going to events."
        />
        {calendar.type === 'public' && (
          <ToggleRow
            checked={editDiscoverable}
            onChange={setEditDiscoverable}
            label="Discoverable"
            description="This calendar appears in search results."
          />
        )}
        <ToggleRow
          checked={editAffectsAvailability}
          onChange={setEditAffectsAvailability}
          label="Show as busy"
          description="Events on this calendar count toward your availability in Find Time."
        />
      </View>

      {/* Danger Zone */}
      {permissions.canDelete && (
        <>
          <RNText style={styles.sectionLabel}>DANGER ZONE</RNText>
          <View style={styles.dangerCard}>
            <RNText style={styles.dangerCopy}>
              Permanently delete this calendar, all its events, and remove all members. This cannot be undone.
            </RNText>
            <RNPressable
              testID="delete-calendar-btn"
              style={styles.dangerBtn}
              onPress={() => setShowDeleteConfirm(true)}
            >
              <RNText style={styles.dangerBtnText}>Delete Calendar</RNText>
            </RNPressable>
          </View>
        </>
      )}
    </View>
  </ScrollView>
)}

<DeleteCalendarConfirmModal
  visible={showDeleteConfirm}
  calendarName={calendar.name ?? ''}
  onCancel={() => setShowDeleteConfirm(false)}
  onConfirm={() => { /* delete wired in Task 7 */ setShowDeleteConfirm(false); }}
/>
```

5. Wrap the existing in-body header (for tests) — expose an inline edit entry testID. Add this small absolutely-positioned button only in `__DEV__` OR always, but with `accessibilityElementsHidden`. For simplicity, add an inline button positioned offscreen so tests can find it without depending on the native header:

```tsx
{
  /* Test affordance: mirrors the header-pencil action. Always renders;
    a no-op in production for sighted users since the header pencil owns the UX. */
}
<RNPressable
  testID="enter-edit-btn-inline"
  onPress={enterEditMode}
  style={styles.testAffordance}
  accessibilityElementsHidden
  importantForAccessibility="no-hide-descendants"
/>;
```

6. Add new styles to the `StyleSheet.create` block:

```tsx
headerSave: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 10 },
headerSaveText: { fontSize: 14, fontWeight: '700' },
editBody: { padding: 16, paddingTop: 20, gap: 16 },
previewCard: {
  flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16,
  borderRadius: 16, backgroundColor: calendarsUIColors.surface,
  borderWidth: 1, borderColor: calendarsUIColors.border,
},
previewTile: {
  width: 52, height: 52, borderRadius: 14, borderWidth: 2,
  alignItems: 'center', justifyContent: 'center',
},
previewLetter: { fontSize: 24, fontWeight: '600' },
previewName: { fontSize: 17, fontWeight: '600', letterSpacing: -0.2 },
previewType: { fontSize: 13, color: calendarsUIColors.textMuted, marginTop: 2, textTransform: 'capitalize' },
textInput: {
  width: '100%', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12,
  borderWidth: 1.5, borderColor: calendarsUIColors.border,
  backgroundColor: calendarsUIColors.surfaceHover,
  fontSize: 16, fontWeight: '500', color: calendarsUIColors.text,
},
textArea: { minHeight: 80, textAlignVertical: 'top', lineHeight: 22 },
swatchRow: {
  flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 12,
  backgroundColor: calendarsUIColors.surface, borderRadius: 14,
  borderWidth: 1, borderColor: calendarsUIColors.border,
},
swatch: { width: 36, height: 36, borderRadius: 10 },
swatchSelected: { borderWidth: 2.5, borderColor: '#FFFFFF' },
dangerCard: {
  padding: 16, borderRadius: 14,
  backgroundColor: calendarsUIColors.dangerLight,
  borderWidth: 1, borderColor: '#FFD4D4',
},
dangerCopy: { fontSize: 13, color: '#CC4444', marginBottom: 12, lineHeight: 19 },
dangerBtn: {
  paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12,
  backgroundColor: calendarsUIColors.danger, alignItems: 'center',
},
dangerBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
testAffordance: { position: 'absolute', width: 1, height: 1, opacity: 0, top: 0, left: 0 },
```

- [ ] **Step 4: Run tests + typecheck**

```bash
cd nebbler && npm run test -- CalendarDetailScreen
cd nebbler && npm run typecheck
```

Expected: all view + edit tests PASS; typecheck PASS.

- [ ] **Step 5: Commit**

```bash
cd nebbler && git add src/screens/CalendarDetailScreen.tsx src/screens/__tests__/CalendarDetailScreen.test.tsx
git commit -m "feat(calendar-detail): implement edit mode UI (NEB-62)"
```

---

## Task 7: Save and Delete Actions

**Goal:** Wire the Save button to `updateCalendar`, the danger-zone modal to `deleteCalendar`, and add success/error toast banners.

**Files:**

- Modify: `nebbler/src/screens/CalendarDetailScreen.tsx`
- Modify: `nebbler/src/screens/__tests__/CalendarDetailScreen.test.tsx`

**Acceptance Criteria:**

- [ ] Save validates the form via `UpdateCalendarSchema.parse`; on validation error, stays in edit mode and shows an inline error toast
- [ ] On valid Save, calls `updateCalendar(calendarId, { name, description, color, rsvp_enabled, discoverable?, affects_availability })` — only includes `discoverable` when `calendar.type === 'public'`
- [ ] Booleans are converted to integers (1/0) for SQLite (matches `updateCalendar` arg shape — `affects_availability: 1 | 0`)
- [ ] On successful save: switches back to view mode, shows a success toast banner ("Changes saved!") for 2s
- [ ] On thrown error: stays in edit mode, shows error toast ("Couldn't save changes. Try again.")
- [ ] Delete confirm onConfirm: calls `deleteCalendar(calendarId)`, then `navigation.goBack()`. Toast on the previous screen is out of scope (would require a global toast store) — leave a `// TODO` referencing it.
- [ ] Tests: save calls `updateCalendar` with the right payload; delete confirm calls `deleteCalendar` and `goBack`; empty name does not call `updateCalendar`; error in `updateCalendar` keeps mode === 'edit'

**Verify:** `npm run test -- CalendarDetailScreen` → all tests PASS. `npm run typecheck`. `npm run lint`.

**Steps:**

- [ ] **Step 1: Add failing save/delete tests**

Append to `nebbler/src/screens/__tests__/CalendarDetailScreen.test.tsx` (above the existing module mocks, refactor `useCalendarMutations` mock to expose spies):

```tsx
// Replace the existing useCalendars mock with an exposed spy version
const mockUpdateCalendar = jest.fn();
const mockDeleteCalendar = jest.fn();
jest.mock('@hooks/useCalendars', () => ({
  useCalendarMutations: () => ({
    updateCalendar: mockUpdateCalendar,
    deleteCalendar: mockDeleteCalendar,
  }),
}));

describe('CalendarDetailScreen — save & delete', () => {
  beforeEach(() => {
    mockUpdateCalendar.mockReset();
    mockDeleteCalendar.mockReset();
  });

  it('calls updateCalendar with current edit state', async () => {
    mockDetail = detail();
    mockUpdateCalendar.mockResolvedValue(undefined);
    const { getByTestId } = render(<CalendarDetailScreen />);
    fireEvent.press(getByTestId('enter-edit-btn-inline'));
    fireEvent.press(getByTestId('save-edit-btn'));
    await Promise.resolve();
    expect(mockUpdateCalendar).toHaveBeenCalledWith(
      'cal-1',
      expect.objectContaining({
        name: 'Game Night',
        color: '#A78BFA',
        affects_availability: 1,
      })
    );
  });

  it('omits discoverable for non-public calendars', async () => {
    mockDetail = detail({ calendar: { ...baseCalendar, type: 'social' } });
    mockUpdateCalendar.mockResolvedValue(undefined);
    const { getByTestId } = render(<CalendarDetailScreen />);
    fireEvent.press(getByTestId('enter-edit-btn-inline'));
    fireEvent.press(getByTestId('save-edit-btn'));
    await Promise.resolve();
    const args = mockUpdateCalendar.mock.calls[0][1];
    expect(args).not.toHaveProperty('discoverable');
  });

  it('shows success toast and returns to view mode on save', async () => {
    mockDetail = detail();
    mockUpdateCalendar.mockResolvedValue(undefined);
    const { getByTestId, getByText, queryByText } = render(<CalendarDetailScreen />);
    fireEvent.press(getByTestId('enter-edit-btn-inline'));
    fireEvent.press(getByTestId('save-edit-btn'));
    await new Promise((r) => setTimeout(r, 0));
    expect(getByText('Changes saved!')).toBeTruthy();
    expect(queryByText('Edit Calendar')).toBeNull();
  });

  it('stays in edit mode on save error', async () => {
    mockDetail = detail();
    mockUpdateCalendar.mockRejectedValue(new Error('boom'));
    const { getByTestId, getByText } = render(<CalendarDetailScreen />);
    fireEvent.press(getByTestId('enter-edit-btn-inline'));
    fireEvent.press(getByTestId('save-edit-btn'));
    await new Promise((r) => setTimeout(r, 0));
    expect(getByText('Edit Calendar')).toBeTruthy();
    expect(getByText(/Couldn't save changes/i)).toBeTruthy();
  });

  it('deletes the calendar and navigates back', async () => {
    mockDetail = detail();
    mockDeleteCalendar.mockResolvedValue(undefined);
    const { getByTestId, getByText } = render(<CalendarDetailScreen />);
    fireEvent.press(getByTestId('enter-edit-btn-inline'));
    fireEvent.press(getByTestId('delete-calendar-btn'));
    fireEvent.press(getByText('Delete'));
    await new Promise((r) => setTimeout(r, 0));
    expect(mockDeleteCalendar).toHaveBeenCalledWith('cal-1');
    expect(mockGoBack).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run failing tests**

Run: `cd nebbler && npm run test -- CalendarDetailScreen` → new tests FAIL.

- [ ] **Step 3: Implement save/delete handlers + toast**

Edit `nebbler/src/screens/CalendarDetailScreen.tsx`:

1. Import:

```tsx
import { useCalendarMutations } from '@hooks/useCalendars';
import { UpdateCalendarSchema } from '@database/schemas';
import { ZodError } from 'zod';
```

2. Inside the component, add:

```tsx
const { updateCalendar, deleteCalendar } = useCalendarMutations();
const [toast, setToast] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

const showToast = useCallback((kind: 'success' | 'error', text: string) => {
  setToast({ kind, text });
  setTimeout(() => setToast(null), 2000);
}, []);

const handleSave = useCallback(async () => {
  if (!calendar) return;
  try {
    UpdateCalendarSchema.parse({
      name: editName,
      description: editDescription,
      color: editColor,
      rsvpEnabled: editRsvp,
      discoverable: editDiscoverable,
      affectsAvailability: editAffectsAvailability,
    });
  } catch (e) {
    if (e instanceof ZodError) {
      showToast('error', e.issues[0]?.message ?? 'Invalid input.');
    }
    return;
  }

  const updates: Parameters<typeof updateCalendar>[1] = {
    name: editName.trim(),
    description: editDescription,
    color: editColor,
    rsvp_enabled: editRsvp ? 1 : 0,
    affects_availability: editAffectsAvailability ? 1 : 0,
  };
  if (calendar.type === 'public') {
    updates.discoverable = editDiscoverable ? 1 : 0;
  }

  try {
    await updateCalendar(calendar.id, updates);
    setMode('view');
    showToast('success', 'Changes saved!');
  } catch {
    showToast('error', "Couldn't save changes. Try again.");
  }
}, [
  calendar,
  editName,
  editDescription,
  editColor,
  editRsvp,
  editDiscoverable,
  editAffectsAvailability,
  updateCalendar,
  showToast,
]);

const handleConfirmDelete = useCallback(async () => {
  if (!calendar) return;
  try {
    await deleteCalendar(calendar.id);
    setShowDeleteConfirm(false);
    // TODO: NEB-62 — drive a global toast on the CalendarsList screen ("{name} deleted.").
    navigation.goBack();
  } catch {
    setShowDeleteConfirm(false);
    showToast('error', "Couldn't delete calendar.");
  }
}, [calendar, deleteCalendar, navigation, showToast]);
```

3. Replace the `onPress={() => { /* save wired in Task 7 */ }}` on the Save button with `onPress={handleSave}`.

4. Replace the placeholder `onConfirm={() => { /* delete wired in Task 7 */ setShowDeleteConfirm(false); }}` with `onConfirm={handleConfirmDelete}`.

5. At the bottom of the outer `<View>`, render the toast:

```tsx
{
  toast && (
    <View
      pointerEvents="none"
      style={[
        styles.toast,
        {
          backgroundColor:
            toast.kind === 'success' ? calendarsUIColors.primary : calendarsUIColors.danger,
        },
      ]}
    >
      <RNText style={styles.toastText}>{toast.text}</RNText>
    </View>
  );
}
```

6. Add styles:

```tsx
toast: {
  position: 'absolute', top: 16, left: 20, right: 20,
  paddingVertical: 14, paddingHorizontal: 18, borderRadius: 14,
  shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.2, shadowRadius: 16, elevation: 6, zIndex: 100,
},
toastText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF', textAlign: 'center' },
```

- [ ] **Step 4: Run tests + lint + typecheck**

```bash
cd nebbler && npm run test -- CalendarDetailScreen
cd nebbler && npm run typecheck
cd nebbler && npm run lint
```

Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
cd nebbler && git add src/screens/CalendarDetailScreen.tsx src/screens/__tests__/CalendarDetailScreen.test.tsx
git commit -m "feat(calendar-detail): wire save and delete with toast feedback"
```

---

## Task 8: Reactive Lifecycle — Pop Back on Removal / Deletion

**Goal:** When the calendar is deleted by another admin (becomes null in the reactive query) OR the user's membership is removed (no membership row), pop the screen back to the list.

**Files:**

- Modify: `nebbler/src/screens/CalendarDetailScreen.tsx`
- Modify: `nebbler/src/screens/__tests__/CalendarDetailScreen.test.tsx`

**Acceptance Criteria:**

- [ ] If `calendar` becomes null **after** a render that had a non-null calendar, the screen calls `navigation.goBack()`
- [ ] If `currentMembership` becomes null **after** initially having one, the screen calls `navigation.goBack()`
- [ ] On first render with `calendar === null` (initial sync racing), the screen does NOT pop back — it renders a blank view and waits
- [ ] Test: render once with calendar, change mock to null calendar on re-render → goBack called
- [ ] Test: render once with membership, change mock to null membership → goBack called
- [ ] Test: render once with `calendar === null` only → goBack NOT called

**Verify:** `npm run test -- CalendarDetailScreen` → all tests PASS.

**Steps:**

- [ ] **Step 1: Write failing tests**

Append:

```tsx
describe('CalendarDetailScreen — reactive lifecycle', () => {
  it('pops back when calendar disappears after initial render', () => {
    mockDetail = detail();
    const { rerender } = render(<CalendarDetailScreen />);
    expect(mockGoBack).not.toHaveBeenCalled();
    mockDetail = detail({ calendar: null });
    rerender(<CalendarDetailScreen />);
    expect(mockGoBack).toHaveBeenCalled();
  });

  it('pops back when membership disappears after initial render', () => {
    mockDetail = detail();
    const { rerender } = render(<CalendarDetailScreen />);
    mockGoBack.mockClear();
    mockDetail = detail({ currentMembership: null });
    rerender(<CalendarDetailScreen />);
    expect(mockGoBack).toHaveBeenCalled();
  });

  it('does NOT pop back on first render with null calendar (still syncing)', () => {
    mockDetail = detail({ calendar: null });
    render(<CalendarDetailScreen />);
    expect(mockGoBack).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run to confirm failure**

Run: `cd nebbler && npm run test -- CalendarDetailScreen` → 2 new tests FAIL.

- [ ] **Step 3: Add lifecycle effect**

Inside the screen, add:

```tsx
const hasLoadedRef = useRef(false);

useEffect(() => {
  if (calendar && currentMembership) {
    hasLoadedRef.current = true;
    return;
  }
  if (hasLoadedRef.current && (!calendar || !currentMembership)) {
    navigation.goBack();
  }
}, [calendar, currentMembership, navigation]);
```

Add `useRef` to the React import.

- [ ] **Step 4: Run tests**

Run: `cd nebbler && npm run test -- CalendarDetailScreen` → all PASS.

- [ ] **Step 5: Commit**

```bash
cd nebbler && git add src/screens/CalendarDetailScreen.tsx src/screens/__tests__/CalendarDetailScreen.test.tsx
git commit -m "feat(calendar-detail): pop back on remote calendar delete or membership removal"
```

---

## Task 9: Wire Entry Points + End-to-End Lint/Typecheck/Test Gate

**Goal:** Confirm `CalendarsScreen` already navigates to `CalendarDetail` on calendar row press (it should — check), update if not, and run the full project `check` script as the final verification.

**Files:**

- Read / possibly modify: `nebbler/src/screens/CalendarsScreen.tsx`

**Acceptance Criteria:**

- [ ] Tapping a `CalendarRow` in `CalendarsScreen` calls `navigation.navigate('CalendarDetail', { calendarId })`. If already true, no code change.
- [ ] `npm run check` passes: lint, format:check, typecheck, jest all green
- [ ] Knip ( `npm run knip` ) does not report dead exports for any new module

**Verify:** `cd nebbler && npm run check` → PASS. `cd nebbler && npm run knip` → 0 errors for new files.

**Steps:**

- [ ] **Step 1: Inspect CalendarsScreen for the row onPress**

Run: `cd nebbler && grep -n "CalendarDetail\|navigate.*Calendar" src/screens/CalendarsScreen.tsx`
Expected: a `navigate('CalendarDetail', { calendarId: ... })` already exists. If not, add it.

If missing, edit `CalendarsScreen.tsx` — locate the `<CalendarRow ... onPress={...} />` usage and replace the onPress with:

```tsx
onPress={() => navigation.navigate('CalendarDetail', { calendarId: calendar.id })}
```

- [ ] **Step 2: Run full check**

```bash
cd nebbler && npm run check
```

Expected: lint clean, format:check clean, typecheck clean, all tests pass.

- [ ] **Step 3: Run knip**

```bash
cd nebbler && npm run knip
```

Expected: no new unused exports flagged. If something is flagged, either re-export from `index.ts` or remove the unused export.

- [ ] **Step 4: Commit (if any changes from step 1 or step 3)**

```bash
cd nebbler && git add -A
git commit -m "chore(calendar-detail): wire entry navigation and finalize NEB-62"
```

- [ ] **Step 5: Manual smoke (optional, outside CI)**

If the user runs the app:

- Open the Calendars tab → tap a social calendar → confirm header + card render
- Tap the pencil → confirm edit mode (or absent for non-admins)
- Tap a swatch → confirm preview updates
- Tap Save → confirm view mode returns and "Changes saved!" toast appears briefly
- For an owner: tap Delete Calendar → tap Delete in modal → confirm pop-back

---

## Notes for the Implementer

- **PowerSync soft-delete:** `useCalendarMutations.deleteCalendar` issues a `DELETE` against the local SQLite. PowerSync forwards this as an op to the backend, which translates it into a soft-delete (`deleted_at` set). The local query already filters `deleted_at IS NULL`. No frontend change needed beyond invoking the existing mutation.
- **Type integers vs booleans:** SQLite booleans are `0 | 1` integers in the schema. `updateCalendar`'s `Partial<Omit<Calendar, 'id'>>` signature accepts integer fields directly — do not pass `true`/`false`.
- **No global toast yet:** The "{Calendar Name} deleted." toast on the previous screen would require a shared store (Zustand) that does not yet exist. Leave a TODO and ship just the navigation goBack for MVP.
- **CreateEvent param:** The FAB targets `CreateEvent` but cannot yet pre-select the calendar — the route does not accept params. Document with a TODO; implement when CreateEvent is updated.
- **CalendarMembersScreen:** Not yet a registered route (NEB-64). The "Invite Members" button and any "See all" affordance are stubs for now with TODO comments.
