import { render, act } from '@testing-library/react-native';
import React from 'react';
import type { ForwardedRef } from 'react';

import { useScheduleStore } from '@stores/useScheduleStore';
import type { FeedRow } from '@utils/scheduleFeed';

// ---- Captured refs (set by mock render callbacks) ----

let capturedOnViewableItemsChanged:
  | ((info: {
      viewableItems: Array<{
        item: FeedRow;
        isViewable: boolean;
        key: string;
        index: number | null;
        timestamp: number;
      }>;
    }) => void)
  | undefined;
let capturedScrollToIndex: jest.Mock;
let capturedOnDateSelected: ((date: string) => void) | undefined;
let capturedOnMomentumScrollEnd: (() => void) | undefined;
let capturedOnScrollBeginDrag: (() => void) | undefined;

// ---- Mocks ----

// jest.mock factories are hoisted before imports, so we must use require() inside them.
// Cast the result to typed React module to avoid unsafe-call/assignment violations.
jest.mock('@components/schedule/EventFeed', () => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- require() needed inside hoisted jest.mock factory
  const { forwardRef, useImperativeHandle } = require('react') as typeof import('react');
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- require() needed inside hoisted jest.mock factory
  const { View } = require('react-native') as typeof import('react-native');

  const scrollToIndex = jest.fn();
  capturedScrollToIndex = scrollToIndex;

  const EventFeed = forwardRef(function EventFeed(
    props: Record<string, unknown>,
    ref: ForwardedRef<{ scrollToIndex: jest.Mock }>
  ) {
    capturedOnViewableItemsChanged =
      props.onViewableItemsChanged as typeof capturedOnViewableItemsChanged;
    capturedOnMomentumScrollEnd = props.onMomentumScrollEnd as (() => void) | undefined;
    capturedOnScrollBeginDrag = props.onScrollBeginDrag as (() => void) | undefined;
    useImperativeHandle(ref, () => ({ scrollToIndex }));
    return <View testID="event-feed" />;
  });

  return { EventFeed };
});

jest.mock('@components/schedule/ScheduleHeader', () => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- require() needed inside hoisted jest.mock factory
  const { View } = require('react-native') as typeof import('react-native');
  return { ScheduleHeader: () => <View testID="schedule-header" /> };
});

jest.mock('@components/schedule/CalendarContainer', () => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- require() needed inside hoisted jest.mock factory
  const { View } = require('react-native') as typeof import('react-native');
  return {
    CalendarContainer: (props: { onDateSelected?: (date: string) => void }) => {
      capturedOnDateSelected = props.onDateSelected;
      return <View testID="calendar-container" />;
    },
  };
});

// Three dates in the mock feed; indexByDate maps each date's day-header
const mockRows: FeedRow[] = [
  { kind: 'day-header', date: '2026-02-27', summary: { countLabel: 'Nothing scheduled yet' } },
  { kind: 'day-header', date: '2026-02-28', summary: { countLabel: '1 event' } },
  { kind: 'day-header', date: '2026-03-01', summary: { countLabel: 'Nothing scheduled yet' } },
];
const mockIndexByDate = new Map<string, number>([
  ['2026-02-27', 0],
  ['2026-02-28', 1],
  ['2026-03-01', 2],
]);

jest.mock('@hooks/useScheduleFeed', () => ({
  useScheduleFeed: () => ({
    rows: mockRows,
    indexByDate: mockIndexByDate,
    events: [],
    isLoading: false,
    error: null,
  }),
}));

jest.mock('@hooks/useCalendarEvents', () => ({
  useMarkedDates: () => ({}),
}));

jest.mock('@hooks/useEventStars', () => ({
  useEventStars: () => new Set<string>(),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));

jest.mock('@utils/dateRange', () => ({
  getMonthBufferRange: () => ({ startDate: '2026-01-27', endDate: '2026-04-27' }),
  monthKeyOf: (d: string) => d.slice(0, 7),
}));

// ---- Helpers ----

function makeViewToken(
  date: string,
  index: number
): {
  item: FeedRow;
  isViewable: boolean;
  key: string;
  index: number;
  timestamp: number;
} {
  return {
    item: { kind: 'day-header', date, summary: { countLabel: 'Nothing scheduled yet' } },
    key: `day-header:${date}:`,
    index,
    isViewable: true,
    timestamp: Date.now(),
  };
}

function fireViewableItemsChanged(dates: string[]) {
  const viewableItems = dates.map((date, i) => makeViewToken(date, i));
  capturedOnViewableItemsChanged?.({ viewableItems });
}

const storeToday = '2026-02-27';

// ---- Tests ----

const { ScheduleScreen } = require('../ScheduleScreen') as {
  ScheduleScreen: () => React.ReactElement;
};

describe('ScheduleScreen scroll-date sync (lock-free)', () => {
  beforeEach(() => {
    useScheduleStore.setState({
      selectedDate: storeToday,
      visibleDate: storeToday,
      today: storeToday,
      viewMode: 'week',
      displayMonth: '2026-02-01',
      programmaticScrollTarget: null,
      starredOnly: false,
    });
    capturedScrollToIndex.mockClear();
  });

  it('updates selectedDate when feed scrolls to a new day-header row', () => {
    render(<ScheduleScreen />);

    act(() => {
      fireViewableItemsChanged(['2026-02-28']);
    });

    expect(useScheduleStore.getState().selectedDate).toBe('2026-02-28');
  });

  it('suppresses viewable-items updates while programmaticScrollTarget is set', () => {
    render(<ScheduleScreen />);

    // Set a programmatic target
    act(() => {
      useScheduleStore.getState().setProgrammaticScrollTarget('2026-02-28');
    });
    expect(useScheduleStore.getState().programmaticScrollTarget).toBe('2026-02-28');

    // Scroll callback fires — should be suppressed (selectedDate stays as storeToday)
    act(() => {
      fireViewableItemsChanged(['2026-03-01']);
    });
    expect(useScheduleStore.getState().selectedDate).toBe(storeToday);
  });

  it('safety-clears programmaticScrollTarget when target header becomes visible', () => {
    render(<ScheduleScreen />);

    act(() => {
      useScheduleStore.getState().setProgrammaticScrollTarget('2026-02-28');
    });

    // Target header becomes visible — should clear the target
    act(() => {
      fireViewableItemsChanged(['2026-02-28']);
    });

    expect(useScheduleStore.getState().programmaticScrollTarget).toBeNull();
  });

  it('calendar tap sets programmaticScrollTarget and calls scrollToIndex', () => {
    render(<ScheduleScreen />);

    act(() => {
      capturedOnDateSelected?.('2026-02-28');
    });

    expect(useScheduleStore.getState().programmaticScrollTarget).toBe('2026-02-28');
    expect(capturedScrollToIndex).toHaveBeenCalledWith(1, { animated: true });
  });

  it('momentum scroll end clears programmaticScrollTarget', () => {
    render(<ScheduleScreen />);

    act(() => {
      useScheduleStore.getState().setProgrammaticScrollTarget('2026-02-28');
    });

    act(() => {
      capturedOnMomentumScrollEnd?.();
    });

    expect(useScheduleStore.getState().programmaticScrollTarget).toBeNull();
  });

  it('user drag (onScrollBeginDrag) clears a stuck programmaticScrollTarget', () => {
    render(<ScheduleScreen />);

    // Simulate the deadlock: target set, but momentum/safety-clear never fired.
    act(() => {
      useScheduleStore.getState().setProgrammaticScrollTarget('2026-02-28');
    });

    // A user-initiated drag must always cancel the in-flight programmatic scroll.
    act(() => {
      capturedOnScrollBeginDrag?.();
    });

    expect(useScheduleStore.getState().programmaticScrollTarget).toBeNull();
  });

  it('out-of-window tap sets target, effect immediately clears it when not loading', () => {
    render(<ScheduleScreen />);

    // '2026-04-01' is not in the mock indexByDate — simulates out-of-window.
    // The feed mock returns isLoading: false, so the effect's stuck-target safety-clear
    // runs immediately and clears the target since the date never appears.
    act(() => {
      capturedOnDateSelected?.('2026-04-01');
    });

    // Target was set and then immediately cleared by the effect (index undefined + !isLoading)
    expect(useScheduleStore.getState().programmaticScrollTarget).toBeNull();
    // scrollToIndex must NOT have been called (no matching row)
    expect(capturedScrollToIndex).not.toHaveBeenCalled();
  });

  it('zero-distance tap does not set programmaticScrollTarget', () => {
    render(<ScheduleScreen />);

    // visibleDate is storeToday; tapping the same date is a zero-distance tap
    act(() => {
      capturedOnDateSelected?.(storeToday);
    });

    expect(useScheduleStore.getState().programmaticScrollTarget).toBeNull();
    expect(capturedScrollToIndex).not.toHaveBeenCalled();
  });

  it('tap with starredOnly on and no matching row does not set programmaticScrollTarget', () => {
    render(<ScheduleScreen />);

    act(() => {
      useScheduleStore.getState().toggleStarredOnly(); // starredOnly → true
    });

    // '2026-04-01' is out-of-window; with starredOnly the day may never appear
    act(() => {
      capturedOnDateSelected?.('2026-04-01');
    });

    expect(useScheduleStore.getState().programmaticScrollTarget).toBeNull();
    expect(capturedScrollToIndex).not.toHaveBeenCalled();
  });

  it('unmount clears programmaticScrollTarget in the global store', () => {
    const { unmount } = render(<ScheduleScreen />);

    act(() => {
      useScheduleStore.getState().setProgrammaticScrollTarget('2026-02-28');
    });

    act(() => {
      unmount();
    });

    expect(useScheduleStore.getState().programmaticScrollTarget).toBeNull();
  });

  it('scrolls feed when date is tapped in month mode', () => {
    render(<ScheduleScreen />);

    act(() => {
      useScheduleStore.getState().setViewMode('month');
    });

    act(() => {
      capturedOnDateSelected?.('2026-02-28');
    });

    expect(capturedScrollToIndex).toHaveBeenCalledWith(1, { animated: true });
  });

  it('updates selectedDate on feed scroll in month mode', () => {
    render(<ScheduleScreen />);

    act(() => {
      useScheduleStore.getState().setViewMode('month');
    });

    act(() => {
      fireViewableItemsChanged(['2026-02-28']);
    });

    expect(useScheduleStore.getState().selectedDate).toBe('2026-02-28');
  });

  it('auto-advances displayMonth when feed scrolls into a new month in month mode', () => {
    render(<ScheduleScreen />);

    act(() => {
      useScheduleStore.getState().setViewMode('month');
    });

    expect(useScheduleStore.getState().displayMonth).toBe('2026-02-01');

    act(() => {
      fireViewableItemsChanged(['2026-03-01']);
    });

    expect(useScheduleStore.getState().displayMonth).toBe('2026-03-01');
  });
});
