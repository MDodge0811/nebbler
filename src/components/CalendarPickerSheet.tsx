import { FlatList, Modal, StyleSheet, View } from 'react-native';
import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { getCalendarColor } from '@utils/calendarColor';
import type { WritableCalendar } from '@hooks/useWritableCalendars';

const overlayStyle = tva({ base: 'flex-1 justify-end' });
const sheetStyle = tva({
  base: 'rounded-t-2xl bg-background-0 pb-8 pt-4',
});
const titleStyle = tva({ base: 'mb-2 px-4 text-lg font-semibold text-typography-900' });
const rowStyle = tva({ base: 'items-center px-4 py-3' });
const calendarNameStyle = tva({ base: 'flex-1 text-base text-typography-900' });
const badgeStyle = tva({ base: 'text-xs text-typography-400' });
const emptyStyle = tva({ base: 'px-4 py-8 text-center text-base text-typography-400' });

const styles = StyleSheet.create({
  overlay: { backgroundColor: 'rgba(0,0,0,0.4)' },
  dot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  checkmark: { fontSize: 16, color: '#00DB74', marginLeft: 8 },
});

function getTypeBadge(type: string | null): string {
  switch (type) {
    case 'private':
      return 'Private';
    case 'social':
      return 'Social';
    case 'public':
      return 'Group';
    default:
      return '';
  }
}

interface CalendarPickerSheetProps {
  visible: boolean;
  calendars: WritableCalendar[];
  selectedCalendarId: string | null;
  onSelect: (calendar: WritableCalendar) => void;
  onClose: () => void;
}

export function CalendarPickerSheet({
  visible,
  calendars,
  selectedCalendarId,
  onSelect,
  onClose,
}: CalendarPickerSheetProps) {
  const renderItem = ({ item }: { item: WritableCalendar }) => {
    const isSelected = item.id === selectedCalendarId;
    const color = getCalendarColor(item.id);
    const badge = getTypeBadge(item.type);

    return (
      <Pressable onPress={() => onSelect(item)}>
        <HStack className={rowStyle({})}>
          <View style={[styles.dot, { backgroundColor: color }]} />
          <Text className={calendarNameStyle({})}>{item.name}</Text>
          {badge ? <Text className={badgeStyle({})}>{badge}</Text> : null}
          {isSelected ? <Text style={styles.checkmark}>&#x2713;</Text> : null}
        </HStack>
      </Pressable>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className={overlayStyle({})} style={styles.overlay} onPress={onClose}>
        <Box className={sheetStyle({})}>
          <Text className={titleStyle({})}>Select Calendar</Text>
          {calendars.length === 0 ? (
            <Text className={emptyStyle({})}>No calendars available</Text>
          ) : (
            <FlatList data={calendars} renderItem={renderItem} keyExtractor={(item) => item.id} />
          )}
        </Box>
      </Pressable>
    </Modal>
  );
}
