import { memo } from 'react';
import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import Svg, { Rect, Path } from 'react-native-svg';

const containerStyle = tva({ base: 'mx-4 mb-3 items-center justify-center rounded-xl py-10' });
const titleStyle = tva({ base: 'text-base font-bold text-typography-400' });
const subtitleStyle = tva({ base: 'mt-1 text-sm text-typography-300' });

function CalendarIllustration() {
  return (
    <Svg width={48} height={48} viewBox="0 0 48 48" fill="none" accessibilityLabel="Empty calendar">
      <Rect x={6} y={10} width={36} height={32} rx={4} stroke="#D1D5DB" strokeWidth={2} />
      <Path d="M6 18h36" stroke="#D1D5DB" strokeWidth={2} />
      <Path d="M16 6v8M32 6v8" stroke="#D1D5DB" strokeWidth={2} strokeLinecap="round" />
      <Rect x={14} y={24} width={6} height={4} rx={1} fill="#E5E7EB" />
      <Rect x={24} y={24} width={6} height={4} rx={1} fill="#E5E7EB" />
      <Rect x={14} y={32} width={6} height={4} rx={1} fill="#E5E7EB" />
    </Svg>
  );
}

export const EmptyDayCard = memo(function EmptyDayCard() {
  return (
    <Box className={containerStyle({})}>
      <VStack className="items-center">
        <CalendarIllustration />
        <Text className={titleStyle({})} style={{ marginTop: 12 }}>
          Nothing on the schedule
        </Text>
        <Text className={subtitleStyle({})}>Hit + to add something</Text>
      </VStack>
    </Box>
  );
});
