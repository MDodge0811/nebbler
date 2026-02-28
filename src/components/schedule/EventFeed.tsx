import { useCallback, useRef, forwardRef, useImperativeHandle, useMemo, useState } from 'react';
import { SectionList, RefreshControl, type ViewToken } from 'react-native';
import { BottomSheetModal, BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { DateSectionHeader } from '@components/schedule/DateSectionHeader';
import { EventCard } from '@components/schedule/EventCard';
import { EmptyDayCard } from '@components/schedule/EmptyDayCard';
import { AllDayEventRow } from '@components/schedule/AllDayEventRow';
import { EventMeatballSheet } from '@components/schedule/EventMeatballSheet';
import { isEmptySentinel } from '@hooks/useScheduleFeed';
import { isAllDayEvent } from '@utils/eventHelpers';
import { useScheduleStore } from '@stores/useScheduleStore';
import type { DateSection, FeedEvent, EmptySentinel } from '@hooks/useScheduleFeed';

const AUTO_COMPACT_THRESHOLD = 5;

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
  const cardDisplayMode = useScheduleStore((s) => s.cardDisplayMode);
  const defaultCardMode = useScheduleStore((s) => s.defaultCardMode);
  const setCardMode = useScheduleStore((s) => s.setCardMode);

  const sectionListRef = useRef<SectionList<FeedEvent | EmptySentinel, DateSection>>(null);
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [meatballEvent, setMeatballEvent] = useState<FeedEvent | null>(null);

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

  // Separate all-day events per section
  const allDayBySection = useMemo(() => {
    const map = new Map<string, FeedEvent[]>();
    for (const section of sections) {
      const allDay: FeedEvent[] = [];
      for (const item of section.data) {
        if (!isEmptySentinel(item) && isAllDayEvent(item.start_time, item.end_time)) {
          allDay.push(item);
        }
      }
      if (allDay.length > 0) map.set(section.title, allDay);
    }
    return map;
  }, [sections]);

  // Filter sections to exclude all-day events from the main list
  const filteredSections = useMemo(() => {
    return sections.map((section) => {
      const allDayIds = new Set(allDayBySection.get(section.title)?.map((e) => e.id) ?? []);
      if (allDayIds.size === 0) return section;

      const filtered = section.data.filter(
        (item) => isEmptySentinel(item) || !allDayIds.has(item.id)
      );
      const timedCount = filtered.filter((item) => !isEmptySentinel(item)).length;
      return {
        ...section,
        data:
          timedCount > 0
            ? filtered
            : [{ _empty: true, id: `empty-${section.title}` } as EmptySentinel],
        eventCount: timedCount,
      };
    });
  }, [sections, allDayBySection]);

  const getCardMode = useCallback(
    (sectionTitle: string, eventCount: number) => {
      const explicit = cardDisplayMode[sectionTitle];
      if (explicit) return explicit;
      if (eventCount >= AUTO_COMPACT_THRESHOLD) return 'compact';
      return defaultCardMode;
    },
    [cardDisplayMode, defaultCardMode]
  );

  const handleMeatballPress = useCallback((event: FeedEvent) => {
    setMeatballEvent(event);
    bottomSheetRef.current?.present();
  }, []);

  const handleDismissSheet = useCallback(() => {
    bottomSheetRef.current?.dismiss();
    setMeatballEvent(null);
  }, []);

  const renderSectionHeader = useCallback(
    ({ section }: { section: DateSection }) => {
      const mode = getCardMode(section.title, section.eventCount);
      const allDayEvents = allDayBySection.get(section.title);

      return (
        <>
          <DateSectionHeader
            dateString={section.title}
            today={today}
            mode={mode}
            onToggleMode={() => {
              const current = getCardMode(section.title, section.eventCount);
              setCardMode(section.title, current === 'full' ? 'compact' : 'full');
            }}
          />
          {allDayEvents && allDayEvents.length > 0 && (
            <AllDayEventRow events={allDayEvents} onEventPress={onEventPress} />
          )}
        </>
      );
    },
    [today, getCardMode, allDayBySection, setCardMode, onEventPress]
  );

  const renderItem = useCallback(
    ({ item, section }: { item: FeedEvent | EmptySentinel; section: DateSection }) => {
      if (isEmptySentinel(item)) {
        return <EmptyDayCard />;
      }
      const mode = getCardMode(section.title, section.eventCount);
      return (
        <EventCard
          event={item}
          mode={mode}
          onPress={() => onEventPress?.(item)}
          onMeatballPress={mode === 'full' ? () => handleMeatballPress(item) : undefined}
        />
      );
    },
    [onEventPress, getCardMode, handleMeatballPress]
  );

  const keyExtractor = useCallback((item: FeedEvent | EmptySentinel) => item.id, []);

  return (
    <BottomSheetModalProvider>
      <SectionList
        style={{ flex: 1 }}
        ref={sectionListRef}
        sections={filteredSections}
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
      <EventMeatballSheet
        ref={bottomSheetRef}
        event={meatballEvent}
        onEdit={handleDismissSheet}
        onDelete={handleDismissSheet}
        onShare={handleDismissSheet}
      />
    </BottomSheetModalProvider>
  );
});
