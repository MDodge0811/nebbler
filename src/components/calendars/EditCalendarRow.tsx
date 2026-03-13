import { StyleSheet, View } from 'react-native';
import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { CalendarIcon } from './CalendarIcon';
import { TypeBadge } from './TypeBadge';
import { DragHandle } from './DragHandle';
import { getCalendarColor } from '@utils/calendarColor';
import type { Calendar } from '@database/schema';

const nameStyle = tva({ base: 'text-[15px] font-medium text-typography-900' });

interface EditCalendarRowProps {
  calendar: Calendar;
  isInPrimaryGroup: boolean;
}

export function EditCalendarRow({ calendar, isInPrimaryGroup }: EditCalendarRowProps) {
  const color = calendar.color ?? getCalendarColor(calendar.id);

  return (
    <HStack
      style={[styles.container, isInPrimaryGroup ? styles.primaryMargin : styles.standardMargin]}
    >
      <DragHandle />
      <CalendarIcon calendarName={calendar.name ?? ''} calendarId={calendar.id} color={color} />
      <View style={styles.info}>
        <HStack style={styles.nameRow}>
          <Text className={nameStyle({})}>{calendar.name}</Text>
          <TypeBadge type={calendar.type} />
        </HStack>
      </View>
    </HStack>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 10,
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
