import { Box } from '@/components/ui/box';
import { DynamicColorText, DynamicColorView } from '@/components/ui/dynamic';
import { Text } from '@/components/ui/text';
import type { CalendarDetailMember } from '@hooks/useCalendarDetail';

import { RoleBadge } from './RoleBadge';

interface MemberRowProps {
  member: CalendarDetailMember;
  calendarColor: string;
}

export function MemberRow({ member, calendarColor }: MemberRowProps) {
  return (
    <Box className="flex-row items-center gap-3 border-b-[0.5px] border-brand-border px-4 py-2.5">
      <DynamicColorView
        className="h-9 w-9 items-center justify-center rounded-full border-[1.5px]"
        backgroundColor={`${calendarColor}20`}
        borderColor={`${calendarColor}40`}
      >
        <DynamicColorText className="text-sm font-bold" color={calendarColor}>
          {member.avatar_initial}
        </DynamicColorText>
      </DynamicColorView>
      <Text className="flex-1 text-[15px] font-medium text-brand-text">{member.display_name}</Text>
      <RoleBadge role={member.role_name} />
    </Box>
  );
}
