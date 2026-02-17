import { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import { CalendarProvider, ExpandableCalendar } from 'react-native-calendars';
import type { DateData } from 'react-native-calendars';
import { calendarColors } from '@constants/calendarColors';
import { useCalendarEvents, useMarkedDates } from '@hooks/useCalendarEvents';

interface WeekMonthCalendarProps {
  /** Currently selected date in YYYY-MM-DD format */
  selectedDate: string;
  /** Called when the user taps a date */
  onDateChange: (date: string) => void;
  /** Called when the visible month changes (for header sync) */
  onMonthChange?: (monthDate: string) => void;
}

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

export function WeekMonthCalendar({
  selectedDate,
  onDateChange,
  onMonthChange,
}: WeekMonthCalendarProps) {
  // CalendarProvider manages its own date state internally. We use a ref
  // for the initial date and local state for the query range so the parent
  // never feeds date changes back as a prop (which causes a scroll-jump
  // feedback loop inside the library).
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
      onDateChange(date);
    },
    [onDateChange]
  );

  const handleMonthChange = useCallback(
    (month: DateData) => {
      setQueryDate(month.dateString);
      onMonthChange?.(month.dateString);
    },
    [onMonthChange]
  );

  return (
    <CalendarProvider
      date={initialDate.current}
      onDateChanged={handleDateChanged}
      onMonthChange={handleMonthChange}
    >
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
