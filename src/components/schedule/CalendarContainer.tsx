import { useCallback, useEffect } from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';

import { Box } from '@/components/ui/box';
import type { MarkedDates } from '@hooks/useCalendarEvents';
import { useScheduleStore } from '@stores/useScheduleStore';
import { getMonthRowCount } from '@utils/monthUtils';

import { GrabHandle, GRAB_HANDLE_HEIGHT } from './GrabHandle';
import { MonthGrid, ROW_HEIGHT as MONTH_ROW_HEIGHT } from './month-grid/MonthGrid';
import { WeekStrip } from './week-strip/WeekStrip';
import { WeekStripDayHeaders } from './week-strip/WeekStripDayHeaders';

const DAY_HEADERS_HEIGHT = 24;
const WEEK_ROW_HEIGHT = 40;
const COLLAPSED_HEIGHT = DAY_HEADERS_HEIGHT + WEEK_ROW_HEIGHT + GRAB_HANDLE_HEIGHT;
const SPRING_CONFIG = { damping: 28, stiffness: 400, mass: 0.8 };
const SNAP_VELOCITY_THRESHOLD = 500;
const SNAP_POSITION_THRESHOLD = 0.4;
// Cross-fade happens over the first 80px of expansion travel
const CROSSFADE_TRAVEL = 80;

function getExpandedHeight(monthKey: string): number {
  return DAY_HEADERS_HEIGHT + getMonthRowCount(monthKey) * MONTH_ROW_HEIGHT + GRAB_HANDLE_HEIGHT;
}

interface CalendarContainerProps {
  onDateSelected?: (date: string) => void;
  markedDates: MarkedDates;
}

export function CalendarContainer({ onDateSelected, markedDates }: CalendarContainerProps) {
  const viewMode = useScheduleStore((s) => s.viewMode);
  const setViewMode = useScheduleStore((s) => s.setViewMode);
  const displayMonth = useScheduleStore((s) => s.displayMonth);
  const setDisplayMonth = useScheduleStore((s) => s.setDisplayMonth);

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
    .activeOffsetY([-10, 10])
    .failOffsetX([-20, 20])
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

  // Cross-fade: strip fades out, grid fades in over the first CROSSFADE_TRAVEL px of expansion
  const stripOpacity = useDerivedValue(() =>
    interpolate(
      heightSV.value,
      [COLLAPSED_HEIGHT, COLLAPSED_HEIGHT + CROSSFADE_TRAVEL],
      [1, 0],
      Extrapolation.CLAMP
    )
  );
  const gridOpacity = useDerivedValue(() =>
    interpolate(
      heightSV.value,
      [COLLAPSED_HEIGHT, COLLAPSED_HEIGHT + CROSSFADE_TRAVEL],
      [0, 1],
      Extrapolation.CLAMP
    )
  );

  const stripStyle = useAnimatedStyle(() => ({
    opacity: stripOpacity.value,
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  }));

  const gridStyle = useAnimatedStyle(() => ({
    opacity: gridOpacity.value,
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  }));

  // At-rest pointer routing: only the visible view receives touches
  const isWeekMode = viewMode === 'week';

  return (
    <Box testID="calendar-container">
      <Animated.View style={animatedContainerStyle}>
        <WeekStripDayHeaders />
        <Box className="relative flex-1">
          {/* WeekStrip — always mounted, fades out as calendar expands */}
          <Animated.View
            style={stripStyle}
            pointerEvents={isWeekMode ? 'box-none' : 'none'}
            testID="week-strip-wrapper"
          >
            <WeekStrip {...(onDateSelected ? { onDateSelected } : {})} markedDates={markedDates} />
          </Animated.View>
          {/* MonthGrid — always mounted, fades in as calendar expands */}
          <Animated.View
            style={gridStyle}
            pointerEvents={isWeekMode ? 'none' : 'box-none'}
            testID="month-grid-wrapper"
          >
            <MonthGrid {...(onDateSelected ? { onDateSelected } : {})} markedDates={markedDates} />
          </Animated.View>
        </Box>
      </Animated.View>
      <GestureDetector gesture={panGesture}>
        <Animated.View hitSlop={{ top: 16, bottom: 16 }}>
          <GrabHandle />
        </Animated.View>
      </GestureDetector>
    </Box>
  );
}
