import { DynamicColorText, DynamicColorView } from '@/components/ui/dynamic';
import { getCalendarColor } from '@utils/calendarColor';

interface CalendarIconProps {
  calendarName: string;
  calendarId: string;
  color?: string | null;
}

export function CalendarIcon({ calendarName, calendarId, color }: CalendarIconProps) {
  const resolvedColor = color ?? getCalendarColor(calendarId);
  const letter = calendarName.charAt(0).toUpperCase();

  return (
    <DynamicColorView
      className="h-[38px] w-[38px] items-center justify-center rounded-[10px] border-[1.5px]"
      backgroundColor={`${resolvedColor}14`}
      borderColor={`${resolvedColor}30`}
    >
      <DynamicColorText className="text-lg font-semibold" color={resolvedColor}>
        {letter}
      </DynamicColorText>
    </DynamicColorView>
  );
}
