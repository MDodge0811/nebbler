import React, { useCallback } from 'react';
import { StyleSheet, Vibration, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { CalendarIcon } from './CalendarIcon';
import { TypeBadge } from './TypeBadge';
import { DragHandle } from './DragHandle';
import { useDragStore } from '@stores/useDragStore';
import { getCalendarColor } from '@utils/calendarColor';
import { UNGROUPED_DROP_ZONE_ID } from '@constants/calendarsUI';
import type { Calendar } from '@database/schema';

const nameStyle = tva({ base: 'text-[15px] font-medium text-typography-900' });

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

  const handleDragStart = useCallback(() => {
    Vibration.vibrate(10);
    startDrag(calendar, sourceGroupId);
  }, [calendar, sourceGroupId, startDrag]);

  const handleDragEnd = useCallback(
    (pageY: number) => {
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
    .onStart(() => {
      'worklet';
      scale.value = withTiming(1.03, { duration: 100 });
      opacity.value = withTiming(0, { duration: 100 });
      zIndex.value = 100;
      runOnJS(handleDragStart)();
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
        <HStack
          style={[
            styles.container,
            isInPrimaryGroup ? styles.primaryMargin : styles.standardMargin,
          ]}
        >
          <View style={isDragDisabled ? styles.dragHandleDisabled : undefined}>
            <DragHandle />
          </View>
          <CalendarIcon calendarName={calendar.name ?? ''} calendarId={calendar.id} color={color} />
          <View style={styles.info}>
            <HStack style={styles.nameRow}>
              <Text className={nameStyle({})}>{calendar.name}</Text>
              <TypeBadge type={calendar.type} />
            </HStack>
          </View>
        </HStack>
      </Animated.View>
    </GestureDetector>
  );
});

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
  dragHandleDisabled: {
    opacity: 0.3,
  },
});
