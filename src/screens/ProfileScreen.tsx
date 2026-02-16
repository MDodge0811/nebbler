import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';

const containerStyle = tva({ base: 'flex-1 items-center justify-center bg-background-0' });
const titleStyle = tva({ base: 'text-2xl font-bold text-typography-900' });
const subtitleStyle = tva({ base: 'mt-2 text-base text-typography-500' });

export function ProfileScreen() {
  return (
    <Box className={containerStyle({})}>
      <Text className={titleStyle({})}>Profile</Text>
      <Text className={subtitleStyle({})}>Coming soon</Text>
    </Box>
  );
}
