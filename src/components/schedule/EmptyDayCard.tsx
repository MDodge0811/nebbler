import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';

const containerStyle = tva({ base: 'mx-4 mb-3 items-center justify-center rounded-xl py-10' });
const titleStyle = tva({ base: 'text-base text-typography-400' });
const subtitleStyle = tva({ base: 'mt-1 text-sm text-typography-300' });

export function EmptyDayCard() {
  return (
    <Box className={containerStyle({})}>
      <VStack className="items-center">
        <Text className={titleStyle({})}>Nothing on the schedule</Text>
        <Text className={subtitleStyle({})}>Hit + to add something</Text>
      </VStack>
    </Box>
  );
}
