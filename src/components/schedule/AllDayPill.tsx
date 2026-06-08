import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { memo } from 'react';

import { Box } from '@/components/ui/box';
import { DynamicColorView } from '@/components/ui/dynamic';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { getCalendarColor } from '@utils/calendarColor';

const pillStyle = tva({
  base: 'mr-2 max-w-[160px] flex-row items-center overflow-hidden rounded-lg bg-typography-50',
});
const titleStyle = tva({ base: 'px-3 py-2 text-xs font-semibold text-typography-700' });

interface AllDayPillProps {
  title: string;
  calendarId: string;
  onPress?: () => void;
}

export const AllDayPill = memo(function AllDayPill({
  title,
  calendarId,
  onPress,
}: AllDayPillProps) {
  const color = getCalendarColor(calendarId);

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={title}>
      <Box className={pillStyle({})}>
        <DynamicColorView className="w-1 self-stretch" backgroundColor={color} />
        <Text className={titleStyle({})} numberOfLines={1}>
          {title}
        </Text>
      </Box>
    </Pressable>
  );
});
