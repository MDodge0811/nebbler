import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { calendarColors } from '@constants/calendarColors';

const rowStyle = tva({ base: 'px-2' });
const headerStyle = tva({ base: 'flex-1 text-center text-xs font-medium' });

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;

export function WeekStripDayHeaders() {
  return (
    <HStack className={rowStyle({})}>
      {DAYS.map((label, i) => (
        <Text key={i} className={headerStyle({})} style={{ color: calendarColors.dayHeaderText }}>
          {label}
        </Text>
      ))}
    </HStack>
  );
}
