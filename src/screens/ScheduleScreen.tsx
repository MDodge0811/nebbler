import { useCallback, useMemo, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { Box } from '@/components/ui/box';
import { ScheduleHeader } from '@components/schedule/ScheduleHeader';
import { WeekMonthCalendar } from '@components/schedule/WeekMonthCalendar';
import { EventFeed } from '@components/schedule/EventFeed';
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
  const [refreshing, setRefreshing] = useState(false);

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

  return (
    <Box className={containerStyle({})}>
      <ScheduleHeader onNavigateToProfile={handleNavigateToProfile} />
      <WeekMonthCalendar />
      <EventFeed sections={sections} refreshing={refreshing} onRefresh={handleRefresh} />
    </Box>
  );
}
