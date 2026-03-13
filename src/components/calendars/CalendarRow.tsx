import { StyleSheet, View } from 'react-native';
import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Pressable } from '@/components/ui/pressable';
import { CalendarIcon } from './CalendarIcon';
import { TypeBadge } from './TypeBadge';
import { CalendarCheckbox } from './CalendarCheckbox';
import { getCalendarColor } from '@utils/calendarColor';
import type { Calendar } from '@database/schema';

const nameStyle = tva({ base: 'text-[15px] font-medium text-typography-900' });
const memberCountStyle = tva({ base: 'mt-px text-xs text-typography-400' });

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
      <HStack
        style={[styles.container, isInPrimaryGroup ? styles.primaryMargin : styles.standardMargin]}
      >
        <CalendarIcon calendarName={calendar.name ?? ''} calendarId={calendar.id} color={color} />
        <View style={styles.info}>
          <HStack style={styles.nameRow}>
            <Text className={nameStyle({})}>{calendar.name}</Text>
            <TypeBadge type={calendar.type} />
          </HStack>
          {memberCount > 0 && (
            <Text className={memberCountStyle({})}>
              {memberCount} {memberCount === 1 ? 'member' : 'members'}
            </Text>
          )}
        </View>
        <CalendarCheckbox checked={isChecked} color={color} onToggle={onToggle} />
      </HStack>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingLeft: 16,
    paddingRight: 14,
    borderRadius: 12,
  },
  primaryMargin: {
    marginHorizontal: 10,
  },
  standardMargin: {
    marginHorizontal: 12,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    alignItems: 'center',
    gap: 7,
  },
});
