import { useCallback, useMemo, useRef, useState } from 'react';
import type { ViewToken } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { Box } from '@/components/ui/box';
import { ScheduleHeader } from '@components/schedule/ScheduleHeader';
import { WeekMonthCalendar } from '@components/schedule/WeekMonthCalendar';
import { EventFeed, type EventFeedRef } from '@components/schedule/EventFeed';
import { useScheduleFeed } from '@hooks/useScheduleFeed';
import { useScheduleStore } from '@stores/useScheduleStore';

const containerStyle = tva({ base: 'flex-1 bg-background-0' });

function getFeedRange(selectedDate: string) {
  const date = new Date(selectedDate + 'T12:00:00');
  const year = date.getFullYear();
  const month = date.getMonth();

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month + 2, 0);

  const pad = (n: number) => String(n).padStart(2, '0');
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  return { startDate: fmt(start), endDate: fmt(end) };
}

export function ScheduleScreen() {
  const navigation = useNavigation();
  const selectedDate = useScheduleStore((s) => s.selectedDate);
  const isSyncLocked = useScheduleStore((s) => s.isSyncLocked);
  const lockSync = useScheduleStore((s) => s.lockSync);
  const unlockSync = useScheduleStore((s) => s.unlockSync);
  const selectDate = useScheduleStore((s) => s.selectDate);
  const [refreshing, setRefreshing] = useState(false);

  const feedRef = useRef<EventFeedRef>(null);

  const { startDate, endDate } = useMemo(() => getFeedRange(selectedDate), [selectedDate]);
  const { sections } = useScheduleFeed(startDate, endDate);

  const handleNavigateToProfile = useCallback(() => {
    navigation.navigate('Profile');
  }, [navigation]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    // PowerSync syncs reactively — this is cosmetic
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  // Feed scroll → calendar update
  const handleViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (isSyncLocked) return;

      // Find the topmost visible section header date
      const topItem = viewableItems.find((item) => item.section != null);
      if (!topItem?.section) return;

      const topDate = (topItem.section as { title: string }).title;
      if (topDate === useScheduleStore.getState().selectedDate) return;

      lockSync();
      selectDate(topDate);
      setTimeout(unlockSync, 100);
    },
    [isSyncLocked, lockSync, selectDate, unlockSync]
  );

  // Calendar tap → feed scroll
  const handleDateSelected = useCallback(
    (date: string) => {
      const sectionIndex = sections.findIndex((s) => s.title === date);
      if (sectionIndex === -1) return;

      lockSync();
      feedRef.current?.scrollToSection(sectionIndex);
      setTimeout(unlockSync, 300);
    },
    [sections, lockSync, unlockSync]
  );

  return (
    <Box className={containerStyle({})}>
      <ScheduleHeader onNavigateToProfile={handleNavigateToProfile} />
      <WeekMonthCalendar onDateSelected={handleDateSelected} />
      <EventFeed
        ref={feedRef}
        sections={sections}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        onViewableItemsChanged={handleViewableItemsChanged}
      />
    </Box>
  );
}
