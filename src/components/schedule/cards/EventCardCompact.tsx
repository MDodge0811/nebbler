import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { LinearGradient } from 'expo-linear-gradient';
import { memo } from 'react';
import { StyleSheet } from 'react-native';

import { Box } from '@/components/ui/box';
import { DynamicColorView } from '@/components/ui/dynamic';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { StarIndicator } from '@components/schedule/cards/StarIndicator';
import type { EventCardProps } from '@components/schedule/cards/types';
import { hexWithAlpha } from '@components/schedule/cards/utils';

const cardStyle = tva({
  base: 'mx-4 mb-2 rounded-xl border shadow-sm',
});
const bodyStyle = tva({ base: 'px-3 py-2' });
const titleStyle = tva({ base: 'text-[13.5px] font-semibold text-typography-900' });
const timeStyle = tva({ base: 'text-[12px] font-medium text-typography-500' });

const gradientFill = StyleSheet.absoluteFill;

export const EventCardCompact = memo(function EventCardCompact({
  title,
  timeRange,
  tintColor,
  starred,
  onPress,
  onLongPress,
}: Pick<
  EventCardProps,
  'title' | 'timeRange' | 'tintColor' | 'starred' | 'onPress' | 'onLongPress'
>) {
  const gradientStart = hexWithAlpha(tintColor, 0.1);
  const gradientEnd = hexWithAlpha(tintColor, 0.03);
  const borderColor = hexWithAlpha(tintColor, 0.3);

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <DynamicColorView className={cardStyle({})} borderColor={borderColor}>
        {/* Tint gradient clipped to the rounded corners; star stays outside the clip. */}
        <Box className="absolute inset-0 overflow-hidden rounded-xl">
          <LinearGradient
            colors={[gradientStart, gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={gradientFill}
          />
        </Box>
        {/* Star overflows top-right — a starred event keeps its star even when compact */}
        {starred === true && <StarIndicator />}
        <HStack className={bodyStyle({})}>
          <VStack className="flex-1">
            <Text className={titleStyle({})} numberOfLines={1}>
              {title}
            </Text>
            {timeRange ? <Text className={timeStyle({})}>{timeRange}</Text> : null}
          </VStack>
        </HStack>
      </DynamicColorView>
    </Pressable>
  );
});
