import { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { Pressable } from '@/components/ui/pressable';
import { getCalendarColor } from '@utils/calendarColor';

const pillStyle = tva({ base: 'mr-2 flex-row items-center overflow-hidden rounded-lg' });
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
      <Box className={pillStyle({})} style={styles.pill}>
        <View style={[styles.accent, { backgroundColor: color }]} />
        <Text className={titleStyle({})} numberOfLines={1}>
          {title}
        </Text>
      </Box>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  pill: {
    backgroundColor: '#F5F5F5',
    maxWidth: 160,
  },
  accent: {
    width: 4,
    alignSelf: 'stretch',
  },
});
