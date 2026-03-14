import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { getCalendarColor } from '@utils/calendarColor';

interface CalendarIconProps {
  calendarName: string;
  calendarId: string;
  color?: string | null;
}

export function CalendarIcon({ calendarName, calendarId, color }: CalendarIconProps) {
  const resolvedColor = color ?? getCalendarColor(calendarId);
  const letter = (calendarName ?? '?').charAt(0).toUpperCase();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: `${resolvedColor}14`,
          borderColor: `${resolvedColor}30`,
        },
      ]}
    >
      <Text style={[styles.letter, { color: resolvedColor }]}>{letter}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    fontSize: 18,
    fontWeight: '600',
  },
});
