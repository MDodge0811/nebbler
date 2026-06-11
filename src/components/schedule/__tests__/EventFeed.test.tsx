import { render, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { useScheduleStore } from '@stores/useScheduleStore';
import type { FeedEvent, FeedRow } from '@utils/scheduleFeed';

import { EventFeed } from '../EventFeed';

// Captured FlashList props so we can assert keyExtractor/getItemType/scroll callbacks directly.
// (Typed on these module-level decls so the jest.mock factory needs no inline
// function-type casts — babel's hoist plugin rejects those.)
let mockRenderItem: ((arg: { item: FeedRow; index: number }) => ReactNode) | undefined;
let mockKeyExtractor: ((row: FeedRow, index: number) => string) | undefined;
let mockGetItemType: ((row: FeedRow) => string) | undefined;
let capturedListProps: Record<string, unknown> = {};

// Override the global (null-rendering) FlashList mock so renderItem actually runs
// for each row — this is what exercises EventFeed's render switch + card mapping.
jest.mock('@shopify/flash-list', () => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- require() inside hoisted jest.mock factory
  const React = require('react') as typeof import('react');
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- require() inside hoisted jest.mock factory
  const { View } = require('react-native') as typeof import('react-native');

  const FlashList = React.forwardRef(function FlashList(props: Record<string, unknown>, _ref) {
    const data = props.data as FeedRow[];
    mockRenderItem = props.renderItem as typeof mockRenderItem;
    mockKeyExtractor = props.keyExtractor as typeof mockKeyExtractor;
    mockGetItemType = props.getItemType as typeof mockGetItemType;
    capturedListProps = props;

    return (
      <View testID="flash-list">
        {data.map((item, index) => (
          <View key={mockKeyExtractor?.(item, index) ?? String(index)}>
            {mockRenderItem?.({ item, index })}
          </View>
        ))}
      </View>
    );
  });

  return { __esModule: true, FlashList, AnimatedFlashList: FlashList };
});

// EventMeatballSheet pulls in the bottom-sheet stack; stub it for this render test.
jest.mock('@components/schedule/EventMeatballSheet', () => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- require() inside hoisted jest.mock factory
  const { View } = require('react-native') as typeof import('react-native');
  return { EventMeatballSheet: () => <View testID="meatball-sheet" /> };
});

function makeEvent(overrides: Partial<FeedEvent> = {}): FeedEvent {
  return {
    id: 'evt-1',
    calendar_id: 'cal-1',
    title: 'Test Event',
    start_time: '2026-03-03T10:00:00Z',
    end_time: '2026-03-03T11:00:00Z',
    calendar_color: '#00DB74',
    calendar_default_view_mode: 'full',
    starred: false,
    attendees: [],
    ...overrides,
  } as unknown as FeedEvent;
}

const rows: FeedRow[] = [
  { kind: 'day-header', date: '2026-03-03', summary: { countLabel: '4 events' } },
  {
    kind: 'all-day',
    date: '2026-03-03',
    event: makeEvent({ id: 'ad-1', title: 'Grandma visiting' }),
  },
  { kind: 'now-line', date: '2026-03-03', label: 'NOW · 10:00' },
  {
    kind: 'event',
    date: '2026-03-03',
    event: makeEvent({ id: 'ev-full', title: 'Coffee with Priya' }),
    mode: 'full',
  },
  {
    kind: 'event',
    date: '2026-03-03',
    event: makeEvent({ id: 'ev-compact', title: 'Lunch with Mom', starred: true }),
    mode: 'compact',
  },
  { kind: 'busy', date: '2026-03-03', event: makeEvent({ id: 'busy-1', title: 'Work' }) },
  { kind: 'quiet-day', date: '2026-03-05' },
];

describe('EventFeed', () => {
  beforeEach(() => {
    mockKeyExtractor = undefined;
    mockGetItemType = undefined;
    capturedListProps = {};
    useScheduleStore.setState({ today: '2026-03-03' });
  });

  function renderFeed() {
    return render(
      <EventFeed rows={rows} refreshing={false} onRefresh={jest.fn()} onEventPress={jest.fn()} />
    );
  }

  it('renders a card for every FeedRow kind', () => {
    renderFeed();
    expect(screen.getByTestId('flash-list')).toBeTruthy();
    // day-header (today)
    expect(screen.getByText(/Today/)).toBeTruthy();
    // all-day
    expect(screen.getByText('Grandma visiting')).toBeTruthy();
    // event (full) + event (compact)
    expect(screen.getByText('Coffee with Priya')).toBeTruthy();
    expect(screen.getByText('Lunch with Mom')).toBeTruthy();
    // busy
    expect(screen.getByText('Busy')).toBeTruthy();
    // quiet-day
    expect(screen.getByText('Open day')).toBeTruthy();
    // now-line renders its label from the row data (format "NOW · h:mm")
    expect(screen.getByText(/NOW/)).toBeTruthy();
  });

  it('renders the star on a starred compact event', () => {
    renderFeed();
    // "Lunch with Mom" is compact + starred — its StarIndicator must still show.
    expect(screen.getByLabelText('Starred')).toBeTruthy();
  });

  it('produces a unique key for every row', () => {
    renderFeed();
    expect(mockKeyExtractor).toBeDefined();
    const keys = rows.map((row, i) => mockKeyExtractor?.(row, i));
    expect(new Set(keys).size).toBe(rows.length);
  });

  it('getItemType returns the row kind, with separate pools for full vs compact events', () => {
    renderFeed();
    expect(mockGetItemType).toBeDefined();
    expect(rows.map((row) => mockGetItemType?.(row))).toEqual([
      'day-header',
      'all-day',
      'now-line',
      'event-full',
      'event-compact',
      'busy',
      'quiet-day',
    ]);
  });

  it('forwards onScrollEndDrag to the list', () => {
    const onScrollEndDrag = jest.fn();
    render(
      <EventFeed
        rows={rows}
        refreshing={false}
        onRefresh={jest.fn()}
        onScrollEndDrag={onScrollEndDrag}
      />
    );
    (capturedListProps.onScrollEndDrag as (() => void) | undefined)?.();
    expect(onScrollEndDrag).toHaveBeenCalledTimes(1);
  });

  it('forwards onMomentumScrollBegin to the list', () => {
    const onMomentumScrollBegin = jest.fn();
    render(
      <EventFeed
        rows={rows}
        refreshing={false}
        onRefresh={jest.fn()}
        onMomentumScrollBegin={onMomentumScrollBegin}
      />
    );
    (capturedListProps.onMomentumScrollBegin as (() => void) | undefined)?.();
    expect(onMomentumScrollBegin).toHaveBeenCalledTimes(1);
  });
});
