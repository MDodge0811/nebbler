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
let capturedOnMonthChanged: ((monthStart: string) => void) | undefined;
let capturedOnMomentumScrollEnd: (() => void) | undefined;
let capturedOnScrollBeginDrag: (() => void) | undefined;
let capturedOnScrollEndDrag: (() => void) | undefined;
let capturedOnMomentumScrollBegin: (() => void) | undefined;

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
    capturedOnScrollEndDrag = props.onScrollEndDrag as (() => void) | undefined;
    capturedOnMomentumScrollBegin = props.onMomentumScrollBegin as (() => void) | undefined;
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
    CalendarContainer: (props: {
      onDateSelected?: (date: string) => void;
      onMonthChanged?: (monthStart: string) => void;
    }) => {
      capturedOnDateSelected = props.onDateSelected;
      capturedOnMonthChanged = props.onMonthChanged;
      return <View testID="calendar-container" />;
    },
  };
});

// Three dates in the mock feed; mockIndexByDate maps each date's day-header.
// The mock returns `new Map(mockIndexByDate)` each call so identity changes
// when the backing map mutates — required for the deferred-scroll effect.
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

// Mutable mock state — tests can flip isFetching to simulate loading transitions.
const mockFeedState = {
  isFetching: false,
};

jest.mock('@hooks/useScheduleFeed', () => ({
  useScheduleFeed: () => ({
    rows: mockRows,
    indexByDate: new Map(mockIndexByDate),
    events: [],
    starredIds: new Set<string>(),
    isLoading: false,
    isFetching: mockFeedState.isFetching,
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
  let rerenderScreen: () => void;

  beforeEach(() => {
    useScheduleStore.setState({
      selectedDate: storeToday,
      visibleDate: storeToday,
      today: storeToday,
      viewMode: 'week',
      displayMonth: '2026-02-01',
      starredOnly: false,
    });
    capturedScrollToIndex.mockClear();
    // Reset mockIndexByDate to initial values
    mockIndexByDate.clear();
    mockIndexByDate.set('2026-02-27', 0);
    mockIndexByDate.set('2026-02-28', 1);
    mockIndexByDate.set('2026-03-01', 2);
    mockFeedState.isFetching = false;
    rerenderScreen = () => {}; // will be overwritten by individual tests that need it
  });

  it('does NOT update selectedDate from viewability when the user is not scrolling', () => {
    render(<ScheduleScreen />);
    act(() => {
      fireViewableItemsChanged(['2026-02-28']); // no drag in progress
    });
    expect(useScheduleStore.getState().selectedDate).toBe(storeToday);
  });

  it('updates selectedDate from viewability during a user drag', () => {
    render(<ScheduleScreen />);
    act(() => {
      capturedOnScrollBeginDrag?.();
      fireViewableItemsChanged(['2026-02-28']);
    });
    expect(useScheduleStore.getState().selectedDate).toBe('2026-02-28');
  });

  it('keeps syncing through the momentum phase of a fling and stops after momentum ends', () => {
    render(<ScheduleScreen />);
    act(() => {
      capturedOnScrollBeginDrag?.();
      capturedOnScrollEndDrag?.();
      capturedOnMomentumScrollBegin?.();
      fireViewableItemsChanged(['2026-02-28']);
    });
    expect(useScheduleStore.getState().selectedDate).toBe('2026-02-28');
    act(() => {
      capturedOnMomentumScrollEnd?.();
      fireViewableItemsChanged(['2026-03-01']); // scroll settled — must be ignored
    });
    expect(useScheduleStore.getState().selectedDate).toBe('2026-02-28');
  });

  it('slow drag without fling: syncs the final top on scrollEndDrag', () => {
    render(<ScheduleScreen />);
    act(() => {
      capturedOnScrollBeginDrag?.();
      fireViewableItemsChanged(['2026-02-28']);
      capturedOnScrollEndDrag?.(); // no momentum follows
    });
    expect(useScheduleStore.getState().selectedDate).toBe('2026-02-28');
  });

  it('in-window tap selects and scrolls directly, and ignores in-flight viewability', () => {
    render(<ScheduleScreen />);
    act(() => {
      useScheduleStore.getState().selectDate('2026-02-28'); // real tap order (WeekStrip)
      capturedOnDateSelected?.('2026-02-28');
    });
    expect(capturedScrollToIndex).toHaveBeenCalledWith(1, { animated: true });
    act(() => {
      fireViewableItemsChanged([storeToday]); // intermediate frame of the animated scroll
      capturedOnMomentumScrollEnd?.(); // iOS fires this for programmatic scrolls
    });
    // Selection must NOT meander back to the intermediate top.
    expect(useScheduleStore.getState().selectedDate).toBe('2026-02-28');
  });

  it('a long programmatic scroll firing TWO momentum-end events does not overwrite the tapped selection', () => {
    // Device evidence (NEB-181): a long scrollToIndex on iOS/FlashList fires
    // onMomentumScrollEnd more than once. The FIRST fires mid-flight; it must not
    // clear suppression and let a LATER momentum-end write the feed's settled top
    // over the tapped day.
    render(<ScheduleScreen />);
    act(() => {
      useScheduleStore.getState().selectDate('2026-02-28'); // tap order (WeekStrip writes first)
      capturedOnDateSelected?.('2026-02-28'); // → selectDate(28) + scrollToIndex(1) + suppress
    });
    expect(capturedScrollToIndex).toHaveBeenCalledWith(1, { animated: true });
    act(() => {
      fireViewableItemsChanged([storeToday]); // feed mid-flight (suppressed)
      capturedOnMomentumScrollEnd?.(); // momentum-end #1 (mid-scroll)
      fireViewableItemsChanged(['2026-03-01']); // feed continues past the target
      capturedOnMomentumScrollEnd?.(); // momentum-end #2 (settle) — must NOT write
    });
    expect(useScheduleStore.getState().selectedDate).toBe('2026-02-28');
  });

  it('out-of-window tap defers the scroll until the date appears in indexByDate', () => {
    // isFetching=true simulates the window loading; prevents the "settled+not found" clear.
    mockFeedState.isFetching = true;
    const { rerender } = render(<ScheduleScreen />);
    rerenderScreen = () => rerender(<ScheduleScreen />);

    act(() => {
      capturedOnDateSelected?.('2026-03-05');
    });
    expect(capturedScrollToIndex).not.toHaveBeenCalled();
    act(() => {
      mockFeedState.isFetching = false;
      mockIndexByDate.set('2026-03-05', 7);
      rerenderScreen(); // trigger the effect with the updated map (new Map identity)
    });
    expect(capturedScrollToIndex).toHaveBeenCalledWith(7, { animated: true });
  });

  it('a user drag cancels a pending deferred scroll', () => {
    // isFetching=true keeps the deferred pending until we trigger the drag.
    mockFeedState.isFetching = true;
    const { rerender } = render(<ScheduleScreen />);
    rerenderScreen = () => rerender(<ScheduleScreen />);

    act(() => {
      capturedOnDateSelected?.('2026-03-05'); // not in indexByDate → deferred
      capturedOnScrollBeginDrag?.();
      mockFeedState.isFetching = false;
      mockIndexByDate.set('2026-03-05', 7);
      rerenderScreen();
    });
    expect(capturedScrollToIndex).not.toHaveBeenCalled();
  });

  it('tap with starredOnly on and no matching row neither scrolls nor defers', () => {
    render(<ScheduleScreen />);
    act(() => {
      useScheduleStore.setState({ starredOnly: true });
      capturedOnDateSelected?.('2026-03-05');
    });
    expect(capturedScrollToIndex).not.toHaveBeenCalled();
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

  it('updates selectedDate on feed scroll in month mode (during drag)', () => {
    render(<ScheduleScreen />);

    act(() => {
      useScheduleStore.getState().setViewMode('month');
    });

    act(() => {
      capturedOnScrollBeginDrag?.();
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
      capturedOnScrollBeginDrag?.();
      fireViewableItemsChanged(['2026-03-01']);
    });

    expect(useScheduleStore.getState().displayMonth).toBe('2026-03-01');
  });

  it('month swipe selects the 1st of the new month and requests a feed scroll', () => {
    // '2026-03-01' is in mockIndexByDate at index 2 — direct-scroll path fires.
    render(<ScheduleScreen />);
    act(() => {
      capturedOnMonthChanged?.('2026-03-01');
    });
    expect(useScheduleStore.getState().selectedDate).toBe('2026-03-01');
    expect(capturedScrollToIndex).toHaveBeenCalledWith(2, { animated: true });
  });
});
