import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { FlatList, Modal } from 'react-native';

import { Box } from '@/components/ui/box';
import { DynamicColorView } from '@/components/ui/dynamic';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import type { WritableCalendar } from '@hooks/useWritableCalendars';
import { getCalendarColor } from '@utils/calendarColor';

const overlayStyle = tva({ base: 'flex-1 justify-end bg-brand-scrim/40' });
const sheetStyle = tva({
  base: 'rounded-t-2xl bg-background-0 pb-8 pt-4',
});
const titleStyle = tva({ base: 'mb-2 px-4 text-lg font-semibold text-typography-900' });
const rowStyle = tva({ base: 'items-center px-4 py-3' });
const calendarNameStyle = tva({ base: 'flex-1 text-base text-typography-900' });
const badgeStyle = tva({ base: 'text-xs text-typography-400' });
const emptyStyle = tva({ base: 'px-4 py-8 text-center text-base text-typography-400' });
const checkmarkStyle = tva({ base: 'ml-2 text-base text-brand-primary' });

function getTypeBadge(type: string | null): string {
  switch (type) {
    case 'private':
      return 'Private';
    case 'social':
      return 'Social';
    case 'public':
      return 'Group';
    case null:
      return '';
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
          <DynamicColorView className="mr-3 h-3 w-3 rounded-full" backgroundColor={color} />
          <Text className={calendarNameStyle({})}>{item.name}</Text>
          {badge ? <Text className={badgeStyle({})}>{badge}</Text> : null}
          {isSelected ? <Text className={checkmarkStyle({})}>&#x2713;</Text> : null}
        </HStack>
      </Pressable>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className={overlayStyle({})} onPress={onClose}>
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
