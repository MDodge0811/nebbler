import { useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import { SectionList, RefreshControl, type ViewToken } from 'react-native';
import { DateSectionHeader } from '@components/schedule/DateSectionHeader';
import { EventCard } from '@components/schedule/EventCard';
import { EmptyDayCard } from '@components/schedule/EmptyDayCard';
import { isEmptySentinel } from '@hooks/useScheduleFeed';
import { useScheduleStore } from '@stores/useScheduleStore';
import type { DateSection, FeedEvent, EmptySentinel } from '@hooks/useScheduleFeed';

export interface EventFeedRef {
  scrollToSection: (sectionIndex: number) => void;
}

interface EventFeedProps {
  sections: DateSection[];
  refreshing: boolean;
  onRefresh: () => void;
  onEventPress?: (event: FeedEvent) => void;
  onViewableItemsChanged?: (info: { viewableItems: ViewToken[] }) => void;
}

const viewabilityConfig = {
  viewAreaCoveragePercentThreshold: 50,
  minimumViewTime: 150,
};

export const EventFeed = forwardRef<EventFeedRef, EventFeedProps>(function EventFeed(
  { sections, refreshing, onRefresh, onEventPress, onViewableItemsChanged },
  ref
) {
  const today = useScheduleStore((s) => s.today);
  const sectionListRef = useRef<SectionList<FeedEvent | EmptySentinel, DateSection>>(null);

  useImperativeHandle(ref, () => ({
    scrollToSection: (sectionIndex: number) => {
      if (sectionIndex < 0 || sectionIndex >= sections.length) return;
      sectionListRef.current?.scrollToLocation({
        sectionIndex,
        itemIndex: 0,
        animated: true,
      });
    },
  }));

  const viewabilityConfigRef = useRef(viewabilityConfig);
  const onViewableItemsChangedRef = useRef(onViewableItemsChanged);
  onViewableItemsChangedRef.current = onViewableItemsChanged;

  const handleViewableItemsChanged = useCallback(
    (info: { viewableItems: ViewToken[]; changed: ViewToken[] }) => {
      onViewableItemsChangedRef.current?.(info);
    },
    []
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: DateSection }) => {
      return <DateSectionHeader dateString={section.title} today={today} />;
    },
    [today]
  );

  const renderItem = useCallback(
    ({ item }: { item: FeedEvent | EmptySentinel }) => {
      if (isEmptySentinel(item)) {
        return <EmptyDayCard />;
      }
      return <EventCard event={item} onPress={() => onEventPress?.(item)} />;
    },
    [onEventPress]
  );

  const keyExtractor = useCallback((item: FeedEvent | EmptySentinel) => item.id, []);

  return (
    <SectionList
      style={{ flex: 1 }}
      ref={sectionListRef}
      sections={sections}
      renderSectionHeader={renderSectionHeader}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      stickySectionHeadersEnabled
      windowSize={5}
      maxToRenderPerBatch={5}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      onViewableItemsChanged={handleViewableItemsChanged}
      viewabilityConfig={viewabilityConfigRef.current}
    />
  );
});
