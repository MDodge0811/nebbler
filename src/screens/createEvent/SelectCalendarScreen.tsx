import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Box } from '@/components/ui/box';
import { DynamicColorView } from '@/components/ui/dynamic';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { useCurrentUser } from '@hooks/useCurrentUser';
import { useWritableCalendars, type WritableCalendar } from '@hooks/useWritableCalendars';
import { getCalendarColor } from '@utils/calendarColor';

import { useCreateEventFormContext } from './CreateEventFormContext';
import { BackIcon } from './icons';

const rowStyle = tva({
  base: 'flex-row items-center gap-3 border-b border-brand-border px-4 py-4',
});
const nameStyle = tva({ base: 'flex-1 text-[16px] text-brand-text' });
const typeStyle = tva({ base: 'text-[13px] text-brand-text-muted' });
const checkStyle = tva({ base: 'text-[16px] font-bold text-brand-primary' });
const emptyStyle = tva({ base: 'px-4 py-8 text-center text-[14px] text-brand-text-muted' });

/** Human label for a calendar's `type` column. */
function calendarTypeLabel(type: string | null | undefined): string {
  if (type === 'social') return 'Social';
  if (type === 'public') return 'Group';
  return 'Private';
}

interface SelectCalendarScreenProps {
  onClose: () => void;
}

/**
 * Full-screen calendar picker pushed over Screen 1. Reads/writes the shared
 * CreateEvent form state directly (it renders inside the form provider), so
 * selecting a calendar updates the flow and slides back.
 */
export function SelectCalendarScreen({ onClose }: SelectCalendarScreenProps) {
  const form = useCreateEventFormContext();
  const { authUser } = useCurrentUser();
  const { data: writableCalendars = [] } = useWritableCalendars(authUser?.id);
  const insets = useSafeAreaInsets();

  const select = (cal: WritableCalendar) => {
    form.setCalendarId(cal.id);
    onClose();
  };

  return (
    <DynamicColorView className="flex-1 bg-background-0" paddingTop={insets.top}>
      <Box className="flex-row items-center gap-2 border-b border-brand-divider px-4 pb-3 pt-2">
        <Pressable
          onPress={onClose}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Back"
          className="h-9 w-9 items-center justify-center rounded-full bg-background-50"
        >
          <BackIcon />
        </Pressable>
        <Text className="text-[17px] font-bold text-brand-text">Select Calendar</Text>
      </Box>

      <ScrollView contentContainerClassName="pb-12">
        {writableCalendars.length === 0 ? (
          <Text className={emptyStyle({})}>No calendars available</Text>
        ) : (
          writableCalendars.map((cal) => (
            <Pressable
              key={cal.id}
              onPress={() => select(cal)}
              accessibilityRole="button"
              className={rowStyle({})}
            >
              <DynamicColorView
                className="h-3 w-3 rounded-[4px]"
                backgroundColor={cal.color ?? getCalendarColor(cal.id)}
              />
              <Text className={nameStyle({})}>{cal.name}</Text>
              <Text className={typeStyle({})}>{calendarTypeLabel(cal.type)}</Text>
              {cal.id === form.calendarId ? <Text className={checkStyle({})}>✓</Text> : null}
            </Pressable>
          ))
        )}
      </ScrollView>
    </DynamicColorView>
  );
}
