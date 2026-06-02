import { tva } from '@gluestack-ui/utils/nativewind-utils';
import React, { useCallback } from 'react';
import { Vibration } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { UNGROUPED_DROP_ZONE_ID } from '@constants/calendarsUI';
import type { Calendar } from '@database/schema';
import { useDragStore } from '@stores/useDragStore';
import { getCalendarColor } from '@utils/calendarColor';

import { CalendarIcon } from './CalendarIcon';
import { DragHandle } from './DragHandle';
import { TypeBadge } from './TypeBadge';

const nameStyle = tva({ base: 'text-[15px] font-medium text-typography-900' });
const containerStyle = tva({
  base: 'items-center gap-2.5 rounded-xl py-2.5 pl-4 pr-[14px]',
  variants: { primary: { true: 'mx-2.5', false: 'mx-3' } },
});

interface DraggableCalendarRowProps {
  calendar: Calendar;
  isInPrimaryGroup: boolean;
  sourceGroupId: string | null;
  isDragDisabled?: boolean;
  onDrop?: (calendarId: string, sourceGroupId: string | null, targetGroupId: string | null) => void;
}

export const DraggableCalendarRow = React.memo(function DraggableCalendarRow({
  calendar,
  isInPrimaryGroup,
  sourceGroupId,
  isDragDisabled,
  onDrop,
}: DraggableCalendarRowProps) {
  const color = calendar.color ?? getCalendarColor(calendar.id);
  const startDrag = useDragStore((s) => s.startDrag);
  const endDrag = useDragStore((s) => s.endDrag);
  const findDropZone = useDragStore((s) => s.findDropZone);
  const setActiveDropZone = useDragStore((s) => s.setActiveDropZone);
  const updateDragPosition = useDragStore((s) => s.updateDragPosition);

  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const zIndex = useSharedValue(0);

  const handleDragStart = useCallback(
    (pageY: number) => {
      Vibration.vibrate(10);
      startDrag(calendar, sourceGroupId);
      updateDragPosition(pageY);
    },
    [calendar, sourceGroupId, startDrag, updateDragPosition]
  );

  const handleDragEnd = useCallback(
    (pageY: number) => {
      if (!useDragStore.getState().isDragging) return;
      const targetGroupId = findDropZone(pageY);
      endDrag();
      if (targetGroupId && onDrop) {
        const resolvedTarget = targetGroupId === UNGROUPED_DROP_ZONE_ID ? null : targetGroupId;
        if (resolvedTarget !== sourceGroupId) {
          onDrop(calendar.id, sourceGroupId, resolvedTarget);
        }
      }
    },
    [findDropZone, endDrag, onDrop, calendar.id, sourceGroupId]
  );

  const handleDragUpdate = useCallback(
    (pageY: number) => {
      const zoneId = findDropZone(pageY);
      setActiveDropZone(zoneId);
      updateDragPosition(pageY);
    },
    [findDropZone, setActiveDropZone, updateDragPosition]
  );

  const longPress = Gesture.LongPress()
    .minDuration(100)
    .enabled(!isDragDisabled)
    .onStart((e) => {
      'worklet';
      scale.value = withTiming(1.03, { duration: 100 });
      opacity.value = withTiming(0, { duration: 100 });
      zIndex.value = 100;
      runOnJS(handleDragStart)(e.absoluteY);
    });

  const pan = Gesture.Pan()
    .enabled(!isDragDisabled)
    .onUpdate((e) => {
      'worklet';
      translateY.value = e.translationY;
      runOnJS(handleDragUpdate)(e.absoluteY);
    })
    .onEnd((e) => {
      'worklet';
      runOnJS(handleDragEnd)(e.absoluteY);
      translateY.value = withTiming(0, { duration: 150 });
      scale.value = withTiming(1, { duration: 150 });
      opacity.value = withTiming(1, { duration: 100 });
      zIndex.value = 0;
    })
    .onFinalize(() => {
      'worklet';
      translateY.value = withTiming(0, { duration: 150 });
      scale.value = withTiming(1, { duration: 150 });
      opacity.value = withTiming(1, { duration: 100 });
      zIndex.value = 0;
    });

  const composed = Gesture.Simultaneous(longPress, pan);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
    zIndex: zIndex.value,
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[animatedStyle]}>
        <HStack className={containerStyle({ primary: isInPrimaryGroup })}>
          <Box className={isDragDisabled ? 'opacity-30' : ''}>
            <DragHandle />
          </Box>
          <CalendarIcon calendarName={calendar.name ?? ''} calendarId={calendar.id} color={color} />
          <Box className="min-w-0 flex-1">
            <HStack className="items-center gap-[7px]">
              <Text className={nameStyle({})}>{calendar.name}</Text>
              <TypeBadge type={calendar.type} />
            </HStack>
          </Box>
        </HStack>
      </Animated.View>
    </GestureDetector>
  );
});
