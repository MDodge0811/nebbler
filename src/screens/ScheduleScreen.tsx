import { useState, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { Box } from '@/components/ui/box';
import { ScheduleHeader } from '@components/schedule/ScheduleHeader';
import { WeekMonthCalendar } from '@components/schedule/WeekMonthCalendar';

const containerStyle = tva({ base: 'flex-1 bg-background-0' });

function todayString() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function ScheduleScreen() {
  const navigation = useNavigation();

  const [selectedDate, setSelectedDate] = useState(todayString);
  const [displayMonth, setDisplayMonth] = useState(selectedDate);

  const handleNavigateToProfile = useCallback(() => {
    navigation.navigate('Profile');
  }, [navigation]);

  const handleDateChange = useCallback((date: string) => {
    setSelectedDate(date);
    setDisplayMonth(date);
  }, []);

  const handleMonthChange = useCallback((monthDate: string) => {
    setDisplayMonth(monthDate);
  }, []);

  return (
    <Box className={containerStyle({})}>
      <ScheduleHeader onNavigateToProfile={handleNavigateToProfile} displayDate={displayMonth} />
      <WeekMonthCalendar
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
        onMonthChange={handleMonthChange}
      />
    </Box>
  );
}
