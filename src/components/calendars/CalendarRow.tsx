import { tva } from '@gluestack-ui/utils/nativewind-utils';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import type { Calendar } from '@database/schema';
import { getCalendarColor } from '@utils/calendarColor';

import { CalendarCheckbox } from './CalendarCheckbox';
import { CalendarIcon } from './CalendarIcon';
import { TypeBadge } from './TypeBadge';

const nameStyle = tva({ base: 'text-[15px] font-medium text-typography-900' });
const memberCountStyle = tva({ base: 'mt-px text-xs text-typography-400' });
const containerStyle = tva({
  base: 'items-center gap-3 rounded-xl py-2.5 pl-4 pr-[14px]',
  variants: { primary: { true: 'mx-2.5', false: 'mx-3' } },
});

interface CalendarRowProps {
  calendar: Calendar;
  memberCount: number;
  isChecked: boolean;
  onToggle: () => void;
  onPress: () => void;
  isInPrimaryGroup: boolean;
}

export function CalendarRow({
  calendar,
  memberCount,
  isChecked,
  onToggle,
  onPress,
  isInPrimaryGroup,
}: CalendarRowProps) {
  const color = calendar.color ?? getCalendarColor(calendar.id);

  return (
    <Pressable onPress={onPress}>
      <HStack className={containerStyle({ primary: isInPrimaryGroup })}>
        <CalendarIcon calendarName={calendar.name ?? ''} calendarId={calendar.id} color={color} />
        <Box className="min-w-0 flex-1">
          <HStack className="items-center gap-[7px]">
            <Text className={nameStyle({})}>{calendar.name}</Text>
            <TypeBadge type={calendar.type} />
          </HStack>
          {memberCount > 0 && (
            <Text className={memberCountStyle({})}>
              {memberCount} {memberCount === 1 ? 'member' : 'members'}
            </Text>
          )}
        </Box>
        <CalendarCheckbox checked={isChecked} color={color} onToggle={onToggle} />
      </HStack>
    </Pressable>
  );
}
