import { render, act } from '@testing-library/react-native';
import type { ViewToken } from 'react-native';
import { useScheduleStore } from '@stores/useScheduleStore';

// ---- Captured refs (set by mock render callbacks) ----

let capturedOnViewableItemsChanged: ((info: { viewableItems: ViewToken[] }) => void) | undefined;
let capturedScrollToSection: jest.Mock;
let capturedOnDateSelected: ((date: string) => void) | undefined;

// ---- Mocks ----

jest.mock('@components/schedule/EventFeed', () => {
  const { forwardRef, useImperativeHandle } = require('react');
  const { View } = require('react-native');

  const scrollToSection = jest.fn();
  capturedScrollToSection = scrollToSection;

  const EventFeed = forwardRef(function EventFeed(props: Record<string, unknown>, ref: unknown) {
    capturedOnViewableItemsChanged =
      props.onViewableItemsChanged as typeof capturedOnViewableItemsChanged;
    useImperativeHandle(ref, () => ({ scrollToSection }));
    return <View testID="event-feed" />;
  });

  return { EventFeed };
});

jest.mock('@components/schedule/ScheduleHeader', () => {
  const { View } = require('react-native');
  return { ScheduleHeader: () => <View testID="schedule-header" /> };
});

jest.mock('@components/schedule/CalendarContainer', () => {
  const { View } = require('react-native');
  return {
    CalendarContainer: (props: { onDateSelected?: (date: string) => void }) => {
      capturedOnDateSelected = props.onDateSelected;
      return <View testID="calendar-container" />;
    },
  };
});

jest.mock('@hooks/useScheduleFeed', () => ({
  useScheduleFeed: () => ({
    sections: [
      { title: '2026-02-27', data: [{ id: 'e1', _empty: true }] },
      { title: '2026-02-28', data: [{ id: 'e2', _empty: true }] },
      { title: '2026-03-01', data: [{ id: 'e3', _empty: true }] },
    ],
    events: [],
    isLoading: false,
    error: null,
  }),
}));

jest.mock('@hooks/useCalendarEvents', () => ({
  useCalendarEvents: () => ({ data: [], error: null }),
  useMarkedDates: () => ({}),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));

jest.mock('@utils/dateRange', () => ({
  getMonthBufferRange: () => ({ startDate: '2026-01-27', endDate: '2026-04-27' }),
  monthKeyOf: (d: string) => d.slice(0, 7),
}));

// ---- Helpers ----

function fireViewableItemsChanged(dates: string[]) {
  const viewableItems: ViewToken[] = dates.map((date, i) => ({
    item: { id: `item-${i}` },
    key: `item-${i}`,
    index: i,
    isViewable: true,
    section: { title: date, data: [] },
  }));
  capturedOnViewableItemsChanged?.({ viewableItems });
}

const storeToday = '2026-02-27';

// ---- Tests ----

const { ScheduleScreen } = require('../ScheduleScreen');

describe('ScheduleScreen scroll-date sync', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    useScheduleStore.setState({
      selectedDate: storeToday,
      visibleDate: storeToday,
      today: storeToday,
      viewMode: 'week',
      displayMonth: '2026-02-01',
      isSyncLocked: false,
    });
    capturedScrollToSection?.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('updates selectedDate when feed scrolls to a new section', () => {
    render(<ScheduleScreen />);

    act(() => {
      fireViewableItemsChanged(['2026-02-28']);
    });

    expect(useScheduleStore.getState().selectedDate).toBe('2026-02-28');
  });

  it('sync lock prevents feedback loops during feed scroll', () => {
    render(<ScheduleScreen />);

    // First update goes through and locks sync
    act(() => {
      fireViewableItemsChanged(['2026-02-28']);
    });
    expect(useScheduleStore.getState().selectedDate).toBe('2026-02-28');
    expect(useScheduleStore.getState().isSyncLocked).toBe(true);

    // While locked, subsequent updates are ignored
    act(() => {
      fireViewableItemsChanged(['2026-03-01']);
    });
    expect(useScheduleStore.getState().selectedDate).toBe('2026-02-28');

    // After unlock delay, updates go through again
    act(() => {
      jest.advanceTimersByTime(100); // FEED_SYNC_UNLOCK_DELAY_MS
    });
    expect(useScheduleStore.getState().isSyncLocked).toBe(false);

    act(() => {
      fireViewableItemsChanged(['2026-03-01']);
    });
    expect(useScheduleStore.getState().selectedDate).toBe('2026-03-01');
  });

  it('throttles rapid date taps (300ms)', () => {
    render(<ScheduleScreen />);

    // First tap goes through
    act(() => {
      capturedOnDateSelected?.('2026-02-28');
    });
    expect(capturedScrollToSection).toHaveBeenCalledWith(1);

    capturedScrollToSection.mockClear();

    // Second tap within 300ms is ignored
    act(() => {
      capturedOnDateSelected?.('2026-03-01');
    });
    expect(capturedScrollToSection).not.toHaveBeenCalled();

    // After 300ms, next tap goes through
    act(() => {
      jest.advanceTimersByTime(300);
    });
    act(() => {
      capturedOnDateSelected?.('2026-03-01');
    });
    expect(capturedScrollToSection).toHaveBeenCalledWith(2);
  });

  it('scrolls feed when date is tapped in month mode', () => {
    render(<ScheduleScreen />);

    act(() => {
      useScheduleStore.getState().setViewMode('month');
    });

    act(() => {
      capturedOnDateSelected?.('2026-02-28');
    });

    expect(capturedScrollToSection).toHaveBeenCalledWith(1);
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
