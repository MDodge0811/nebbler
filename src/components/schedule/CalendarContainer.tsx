import { useCallback, useEffect, useRef } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { WeekStripDayHeaders } from './week-strip/WeekStripDayHeaders';
import { WeekStrip } from './week-strip/WeekStrip';
import { MonthGrid, ROW_HEIGHT as MONTH_ROW_HEIGHT } from './month-grid/MonthGrid';
import { GrabHandle, GRAB_HANDLE_HEIGHT } from './GrabHandle';
import { useScheduleStore } from '@stores/useScheduleStore';
import { getMonthGrid } from '@utils/monthUtils';

const DAY_HEADERS_HEIGHT = 24;
const WEEK_ROW_HEIGHT = 40;
const COLLAPSED_HEIGHT = DAY_HEADERS_HEIGHT + WEEK_ROW_HEIGHT + GRAB_HANDLE_HEIGHT;
const SPRING_CONFIG = { damping: 28, stiffness: 400, mass: 0.8 };
const SNAP_VELOCITY_THRESHOLD = 500;
const SNAP_POSITION_THRESHOLD = 0.4;

function getExpandedHeight(monthKey: string): number {
  const grid = getMonthGrid(monthKey);
  return DAY_HEADERS_HEIGHT + grid.rowCount * MONTH_ROW_HEIGHT + GRAB_HANDLE_HEIGHT;
}

interface CalendarContainerProps {
  onDateSelected?: (date: string) => void;
  markedDates: Record<string, { marked: true; dotColor: string }>;
}

export function CalendarContainer({ onDateSelected, markedDates }: CalendarContainerProps) {
  const viewMode = useScheduleStore((s) => s.viewMode);
  const setViewMode = useScheduleStore((s) => s.setViewMode);
  const displayMonth = useScheduleStore((s) => s.displayMonth);
  const setDisplayMonth = useScheduleStore((s) => s.setDisplayMonth);

  // Once MonthGrid has been shown, keep it mounted to avoid remount costs
  const hasExpandedRef = useRef(false);
  if (viewMode === 'month') hasExpandedRef.current = true;
  const showMonthGrid = viewMode === 'month' || hasExpandedRef.current;

  const heightSV = useSharedValue(COLLAPSED_HEIGHT);
  const startHeight = useSharedValue(COLLAPSED_HEIGHT);
  const expandedHeightSV = useSharedValue(getExpandedHeight(displayMonth));

  // Sync expandedHeightSV when displayMonth changes
  useEffect(() => {
    const target = getExpandedHeight(displayMonth);
    expandedHeightSV.value = target;
    if (viewMode === 'month') {
      heightSV.value = withSpring(target, SPRING_CONFIG);
    }
  }, [displayMonth, viewMode, heightSV, expandedHeightSV]);

  const handleExpand = useCallback(() => {
    const currentVisible = useScheduleStore.getState().visibleDate;
    const monthStart = currentVisible.slice(0, 7) + '-01';
    setDisplayMonth(monthStart);
    setViewMode('month');
  }, [setDisplayMonth, setViewMode]);

  const handleCollapse = useCallback(() => {
    setViewMode('week');
  }, [setViewMode]);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      'worklet';
      startHeight.value = heightSV.value;
    })
    .onUpdate((e) => {
      'worklet';
      const newHeight = startHeight.value + e.translationY;
      heightSV.value = Math.min(Math.max(newHeight, COLLAPSED_HEIGHT), expandedHeightSV.value);
    })
    .onEnd((e) => {
      'worklet';
      const range = expandedHeightSV.value - COLLAPSED_HEIGHT;
      const travel = range > 0 ? (heightSV.value - COLLAPSED_HEIGHT) / range : 0;
      const shouldExpand =
        e.velocityY > SNAP_VELOCITY_THRESHOLD ||
        (e.velocityY > -SNAP_VELOCITY_THRESHOLD && travel > SNAP_POSITION_THRESHOLD);

      if (shouldExpand) {
        heightSV.value = withSpring(expandedHeightSV.value, SPRING_CONFIG);
        runOnJS(handleExpand)();
      } else {
        heightSV.value = withSpring(COLLAPSED_HEIGHT, SPRING_CONFIG);
        runOnJS(handleCollapse)();
      }
    });

  const animatedContainerStyle = useAnimatedStyle(() => ({
    height: heightSV.value,
    overflow: 'hidden' as const,
  }));

  const isWeekMode = viewMode === 'week';

  return (
    <View testID="calendar-container">
      <Animated.View style={animatedContainerStyle}>
        <WeekStripDayHeaders />
        <View style={{ flex: 1, position: 'relative' }}>
          {isWeekMode && <WeekStrip onDateSelected={onDateSelected} markedDates={markedDates} />}
          {showMonthGrid && !isWeekMode && (
            <MonthGrid onDateSelected={onDateSelected} markedDates={markedDates} />
          )}
        </View>
      </Animated.View>
      <GestureDetector gesture={panGesture}>
        <Animated.View>
          <GrabHandle />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
