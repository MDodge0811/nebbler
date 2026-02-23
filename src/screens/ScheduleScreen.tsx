import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { Box } from '@/components/ui/box';
import { ScheduleHeader } from '@components/schedule/ScheduleHeader';
import { WeekMonthCalendar } from '@components/schedule/WeekMonthCalendar';

const containerStyle = tva({ base: 'flex-1 bg-background-0' });

export function ScheduleScreen() {
  const navigation = useNavigation();

  const handleNavigateToProfile = useCallback(() => {
    navigation.navigate('Profile');
  }, [navigation]);

  return (
    <Box className={containerStyle({})}>
      <ScheduleHeader onNavigateToProfile={handleNavigateToProfile} />
      <WeekMonthCalendar />
    </Box>
  );
}
