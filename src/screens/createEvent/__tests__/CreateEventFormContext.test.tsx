import { act, render } from '@testing-library/react-native';
import { Text } from 'react-native';

import {
  CreateEventFormProvider,
  useCreateEventFormContext,
  type CreateEventFormValue,
} from '../CreateEventFormContext';

const mockCreateEvent = jest.fn();
const mockUpdateEvent = jest.fn();
const mockCreateResponse = jest.fn();
let mockEditEvent: Record<string, unknown> | null = null;
// member user ids returned by useCalendarMemberUserIds (includes the requester
// 'me-1' to verify it's excluded from socialMemberIds/invitedUserIds).
let mockMemberUserIds: string[] = [];

jest.mock('@hooks/useCalendarEvents', () => ({
  useEventMutations: () => ({
    createEvent: mockCreateEvent,
    updateEvent: mockUpdateEvent,
  }),
  useEventById: () => mockEditEvent,
}));

jest.mock('@hooks/useCalendarMembers', () => ({
  useCalendarMemberUserIds: () => mockMemberUserIds,
}));

jest.mock('@hooks/useEventResponses', () => ({
  useEventResponseMutations: () => ({ createResponse: mockCreateResponse }),
}));

jest.mock('@hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({ authUser: { id: 'me-1' } }),
}));

jest.mock('@hooks/useWritableCalendars', () => ({
  useWritableCalendars: () => ({
    data: [
      { id: 'cal-1', name: 'Work', type: 'private' },
      { id: 'cal-soc', name: 'Book Club', type: 'social' },
    ],
  }),
}));

// Captures the live context value so tests can drive setters + call save().
let ctx: CreateEventFormValue;
function Capture() {
  ctx = useCreateEventFormContext();
  return <Text>ready</Text>;
}

function renderProvider(params?: Parameters<typeof CreateEventFormProvider>[0]['params']) {
  return render(
    <CreateEventFormProvider params={params}>
      <Capture />
    </CreateEventFormProvider>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockEditEvent = null;
  mockMemberUserIds = [];
});

describe('CreateEventFormContext — create mode', () => {
  it('defaults the calendar to the first writable calendar', () => {
    renderProvider();
    expect(ctx.calendarId).toBe('cal-1');
    expect(ctx.mode).toBe('create');
  });

  it('applies preselected calendar + people from route params', () => {
    renderProvider({ preselectedCalendarId: 'cal-9', preselectedPeople: ['p-1', 'p-2'] });
    expect(ctx.calendarId).toBe('cal-9');
    expect(ctx.peopleIds).toEqual(['p-1', 'p-2']);
  });

  it('applies socialContext calendar as a preselect', () => {
    renderProvider({ socialContext: { calendarId: 'cal-soc' } });
    expect(ctx.calendarId).toBe('cal-soc');
  });

  it('isScreen1Valid requires a title and a calendar', () => {
    renderProvider();
    expect(ctx.isScreen1Valid).toBe(false);
    act(() => ctx.setTitle('Lunch'));
    expect(ctx.isScreen1Valid).toBe(true);
  });

  it('save() creates the event and invites each selected person as pending', async () => {
    mockCreateEvent.mockResolvedValue('evt-new');
    renderProvider();
    act(() => {
      ctx.setTitle('Lunch');
      ctx.setPeopleIds(['p-1', 'p-2']);
    });

    await act(async () => {
      await ctx.save();
    });

    expect(mockCreateEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        calendarId: 'cal-1',
        createdByUserId: 'me-1',
        title: 'Lunch',
        showAs: 'busy',
        isAllDay: false,
      })
    );
    expect(mockCreateResponse).toHaveBeenCalledTimes(2);
    expect(mockCreateResponse).toHaveBeenCalledWith('evt-new', 'p-1', 'pending');
    expect(mockCreateResponse).toHaveBeenCalledWith('evt-new', 'p-2', 'pending');
  });

  it('defaults showAs to busy and persists setShowAs("free") on save', async () => {
    mockCreateEvent.mockResolvedValue('evt-free');
    renderProvider();
    expect(ctx.showAs).toBe('busy');
    act(() => {
      ctx.setTitle('Focus');
      ctx.setShowAs('free');
    });
    expect(ctx.showAs).toBe('free');

    await act(async () => {
      await ctx.save();
    });

    expect(mockCreateEvent).toHaveBeenCalledWith(expect.objectContaining({ showAs: 'free' }));
  });

  it('save() rejects when createEvent returns no id (invites not silently skipped)', async () => {
    mockCreateEvent.mockResolvedValue(undefined);
    renderProvider();
    act(() => {
      ctx.setTitle('Lunch');
      ctx.setPeopleIds(['p-1']);
    });

    await act(async () => {
      await expect(ctx.save()).rejects.toThrow(/no id returned/);
    });

    expect(mockCreateResponse).not.toHaveBeenCalled();
  });

  describe('isDirty', () => {
    it('is false when pristine (defaults + preselected people only)', () => {
      renderProvider({ preselectedPeople: ['p-1', 'p-2'] });
      expect(ctx.isDirty).toBe(false);
    });

    it('becomes true after the title changes', () => {
      renderProvider();
      expect(ctx.isDirty).toBe(false);
      act(() => ctx.setTitle('Lunch'));
      expect(ctx.isDirty).toBe(true);
    });

    it('becomes true after the calendar changes', () => {
      renderProvider();
      expect(ctx.isDirty).toBe(false);
      act(() => ctx.setCalendarId('cal-other'));
      expect(ctx.isDirty).toBe(true);
    });
  });
});

describe('CreateEventFormContext — social mode (NEB-133)', () => {
  it('is not social for a default (non-social) launch', () => {
    renderProvider();
    expect(ctx.isSocial).toBe(false);
    expect(ctx.memberCount).toBe(0);
    expect(ctx.socialMemberIds).toEqual([]);
  });

  it('detects social mode from socialContext and locks the calendar', () => {
    mockMemberUserIds = ['me-1', 'm-1', 'm-2'];
    renderProvider({ socialContext: { calendarId: 'cal-soc' } });
    expect(ctx.isSocial).toBe(true);
    expect(ctx.calendarId).toBe('cal-soc');
  });

  it('excludes the requester from memberCount and socialMemberIds', () => {
    mockMemberUserIds = ['me-1', 'm-1', 'm-2'];
    renderProvider({ socialContext: { calendarId: 'cal-soc' } });
    expect(ctx.socialMemberIds).toEqual(['m-1', 'm-2']);
    expect(ctx.memberCount).toBe(2);
  });

  it('invitedUserIds = social members ∪ extra guests, minus requester', () => {
    mockMemberUserIds = ['me-1', 'm-1', 'm-2'];
    renderProvider({ socialContext: { calendarId: 'cal-soc' } });
    act(() => ctx.setPeopleIds(['g-1', 'm-2']));
    // m-2 is both a member and re-added as a guest → deduped; me-1 excluded.
    expect([...ctx.invitedUserIds].sort()).toEqual(['g-1', 'm-1', 'm-2']);
  });

  it('save() invites members AND extra guests (not just guests)', async () => {
    mockCreateEvent.mockResolvedValue('evt-soc');
    mockMemberUserIds = ['me-1', 'm-1', 'm-2'];
    renderProvider({ socialContext: { calendarId: 'cal-soc' } });
    act(() => {
      ctx.setTitle('Meetup');
      ctx.setPeopleIds(['g-1']);
    });

    await act(async () => {
      await ctx.save();
    });

    // 2 members (m-1, m-2) + 1 guest (g-1); requester me-1 never invited.
    expect(mockCreateResponse).toHaveBeenCalledTimes(3);
    expect(mockCreateResponse).toHaveBeenCalledWith('evt-soc', 'm-1', 'pending');
    expect(mockCreateResponse).toHaveBeenCalledWith('evt-soc', 'm-2', 'pending');
    expect(mockCreateResponse).toHaveBeenCalledWith('evt-soc', 'g-1', 'pending');
    expect(mockCreateResponse).not.toHaveBeenCalledWith('evt-soc', 'me-1', 'pending');
  });
});

describe('CreateEventFormContext — edit mode', () => {
  beforeEach(() => {
    mockEditEvent = {
      id: 'evt-7',
      title: 'Standup',
      description: 'Daily',
      calendar_id: 'cal-1',
      start_time: '2026-06-10T09:00:00Z',
      end_time: '2026-06-10T09:30:00Z',
      is_all_day: 0,
      show_as: 'free',
    };
  });

  it('prefills fields from the loaded event', () => {
    renderProvider({ mode: 'edit', eventId: 'evt-7' });
    expect(ctx.mode).toBe('edit');
    expect(ctx.title).toBe('Standup');
    expect(ctx.description).toBe('Daily');
    expect(ctx.showAs).toBe('free');
  });

  it('is not dirty after a pristine prefill', () => {
    renderProvider({ mode: 'edit', eventId: 'evt-7' });
    expect(ctx.isDirty).toBe(false);
  });

  it('becomes dirty after changing a prefilled field', () => {
    renderProvider({ mode: 'edit', eventId: 'evt-7' });
    expect(ctx.isDirty).toBe(false);
    act(() => ctx.setTitle('Standup (moved)'));
    expect(ctx.isDirty).toBe(true);
  });

  it('save() updates the existing event and does not create responses', async () => {
    renderProvider({ mode: 'edit', eventId: 'evt-7' });
    await act(async () => {
      await ctx.save();
    });
    expect(mockUpdateEvent).toHaveBeenCalledWith(
      'evt-7',
      expect.objectContaining({ title: 'Standup', show_as: 'free' })
    );
    expect(mockCreateEvent).not.toHaveBeenCalled();
    expect(mockCreateResponse).not.toHaveBeenCalled();
  });
});
