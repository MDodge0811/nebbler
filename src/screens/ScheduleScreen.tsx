import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { ScheduleHeader } from '@components/schedule/ScheduleHeader';

const containerStyle = tva({ base: 'flex-1 bg-background-0' });
const placeholderStyle = tva({ base: 'flex-1 items-center justify-center' });
const placeholderTextStyle = tva({ base: 'text-base text-typography-500' });

export function ScheduleScreen() {
  const navigation = useNavigation();

  const handleNavigateToProfile = useCallback(() => {
    navigation.navigate('Profile');
  }, [navigation]);

  return (
    <Box className={containerStyle({})}>
      <ScheduleHeader onNavigateToProfile={handleNavigateToProfile} />
      <Box className={placeholderStyle({})}>
        <Text className={placeholderTextStyle({})}>Schedule content coming soon</Text>
      </Box>
    </Box>
  );
}
