import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import type { MainTabScreenProps } from '@navigation/types';

const containerStyle = tva({ base: 'flex-1 items-center justify-center bg-background-0' });
const titleStyle = tva({ base: 'text-2xl font-bold text-typography-900' });

export function SettingsScreen(_props: MainTabScreenProps<'Settings'>) {
  return (
    <Box className={containerStyle({})}>
      <Text className={titleStyle({})}>Settings Screen</Text>
    </Box>
  );
}
