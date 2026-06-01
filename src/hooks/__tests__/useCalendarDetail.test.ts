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
