import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import type { RootStackScreenProps } from '@navigation/types';

const containerStyle = tva({ base: 'flex-1 items-center justify-center bg-background-0' });
const titleStyle = tva({ base: 'text-2xl font-bold text-typography-900' });
const subtitleStyle = tva({ base: 'mt-2.5 text-base text-typography-600' });

export function DetailsScreen({ route }: RootStackScreenProps<'Details'>) {
  const { itemId, title } = route.params;

  return (
    <Box className={containerStyle({})}>
      <Text className={titleStyle({})}>{title}</Text>
      <Text className={subtitleStyle({})}>Item ID: {itemId}</Text>
    </Box>
  );
}
