import { useMemo, useCallback, useEffect, useRef, useState, useContext } from 'react';
import { CalendarProvider, ExpandableCalendar, CalendarContext } from 'react-native-calendars';
import type { DateData } from 'react-native-calendars';
import { calendarColors } from '@constants/calendarColors';
import { useCalendarEvents, useMarkedDates } from '@hooks/useCalendarEvents';
import { useScheduleStore } from '@stores/useScheduleStore';

// Force the CalendarHeader container to a fixed height that matches just
// the day-names row. The stylesheet override collapses the title row to 0,
// so this is all that's needed. ExpandableCalendar measures the header's
// rendered height via onLayout to compute closedHeight and positioning.
const HEADER_HEIGHT = 32;

const headerContainerStyle = { height: HEADER_HEIGHT };

const calendarTheme = {
  calendarBackground: calendarColors.background,
  backgroundColor: calendarColors.background,
  textSectionTitleColor: calendarColors.dayHeaderText,
  selectedDayBackgroundColor: calendarColors.selected,
  selectedDayTextColor: '#FFFFFF',
  todayTextColor: '#FFFFFF',
  todayBackgroundColor: calendarColors.today,
  dayTextColor: calendarColors.dayText,
  textDisabledColor: calendarColors.disabled,
  dotColor: calendarColors.eventDot,
  selectedDotColor: calendarColors.eventDot,
  arrowColor: calendarColors.dayText,
  monthTextColor: calendarColors.dayText,
  textDayFontSize: 16,
  textMonthFontSize: 16,
  textDayHeaderFontSize: 12,
  todayDotColor: calendarColors.eventDot,
  // Collapse the title row (arrows + month/year title) to 0 height.
  // The ScheduleHeader already shows month/year, so this is redundant.
  // We force the CalendarHeader's outer height via headerStyle to keep
  // ExpandableCalendar's positioning math correct.
  'stylesheet.calendar.header': {
    header: {
      height: 0,
      overflow: 'hidden' as const,
    },
    // Must re-declare week styles here because 'stylesheet.calendar.header'
    // replaces the entire header stylesheet. Omitting this loses the default layout.
    week: {
      marginTop: 7,
      marginBottom: -4,
      flexDirection: 'row' as const,
      justifyContent: 'space-around' as const,
    },
  },
};

/**
 * Compute the query date range as a +/-1 month buffer around the given date.
 * Returns YYYY-MM-DD strings for start and end.
 */
function getQueryRange(dateString: string) {
  const date = new Date(dateString + 'T12:00:00');
  const year = date.getFullYear();
  const month = date.getMonth();

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month + 2, 0); // last day of next month

  const pad = (n: number) => String(n).padStart(2, '0');
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  return { startDate: fmt(start), endDate: fmt(end) };
}

/**
 * Bridge component that syncs the feed's selected date back into the
 * calendar strip when the change originated from feed scrolling (isSyncLocked).
 * Must be rendered inside CalendarProvider to access CalendarContext.
 */
function CalendarSyncBridge() {
  const calendarContext = useContext(CalendarContext);
  const selectedDate = useScheduleStore((s) => s.selectedDate);
  const isSyncLocked = useScheduleStore((s) => s.isSyncLocked);

  useEffect(() => {
    if (isSyncLocked && calendarContext?.setDate) {
      // 'listDrag' is UpdateSources.LIST_DRAG — imported from internal path
      // to avoid TS error (not re-exported from top-level module)
      calendarContext.setDate(selectedDate, 'listDrag' as never);
    }
  }, [selectedDate, isSyncLocked, calendarContext]);

  return null;
}

interface WeekMonthCalendarProps {
  onDateSelected?: (date: string) => void;
}

export function WeekMonthCalendar({ onDateSelected }: WeekMonthCalendarProps) {
  const selectedDate = useScheduleStore((s) => s.selectedDate);
  const selectDate = useScheduleStore((s) => s.selectDate);
  const setVisibleDate = useScheduleStore((s) => s.setVisibleDate);
  const isSyncLocked = useScheduleStore((s) => s.isSyncLocked);

  // CalendarProvider manages its own date state internally. We use a ref
  // for the initial date and local state for the query range so the store's
  // selectedDate is never fed back into CalendarProvider as a controlled prop
  // (which causes a scroll-jump feedback loop inside the library).
  const initialDate = useRef(selectedDate);
  const [queryDate, setQueryDate] = useState(selectedDate);

  const { startDate, endDate } = useMemo(() => getQueryRange(queryDate), [queryDate]);

  const { data: events = [], error } = useCalendarEvents(startDate, endDate);
  const markedDates = useMarkedDates(events);

  useEffect(() => {
    if (error) console.warn('useCalendarEvents query failed:', error);
  }, [error]);

  const handleDateChanged = useCallback(
    (date: string) => {
      // When sync is locked, the change came from the feed scroll —
      // don't re-select or notify the parent (would cause a loop).
      if (isSyncLocked) return;

      selectDate(date);
      onDateSelected?.(date);
    },
    [selectDate, isSyncLocked, onDateSelected]
  );

  const handleMonthChange = useCallback(
    (month: DateData) => {
      setQueryDate(month.dateString);
      setVisibleDate(month.dateString);
    },
    [setVisibleDate]
  );

  return (
    <CalendarProvider
      date={initialDate.current}
      onDateChanged={handleDateChanged}
      onMonthChange={handleMonthChange}
    >
      <CalendarSyncBridge />
      <ExpandableCalendar
        theme={calendarTheme}
        markedDates={markedDates}
        firstDay={0}
        closeOnDayPress={false}
        hideKnob={false}
        allowShadow={false}
        hideArrows
        headerStyle={headerContainerStyle}
      />
    </CalendarProvider>
  );
}
