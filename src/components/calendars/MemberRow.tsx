import { StyleSheet, Text as RNText, View } from 'react-native';
import { calendarsUIColors } from '@constants/calendarsUI';
import { RoleBadge } from './RoleBadge';
import type { CalendarDetailMember } from '@hooks/useCalendarDetail';

interface MemberRowProps {
  member: CalendarDetailMember;
  calendarColor: string;
}

export function MemberRow({ member, calendarColor }: MemberRowProps) {
  return (
    <View style={styles.row}>
      <View
        style={[
          styles.avatar,
          { backgroundColor: `${calendarColor}20`, borderColor: `${calendarColor}40` },
        ]}
      >
        <RNText style={[styles.avatarLetter, { color: calendarColor }]}>
          {member.avatar_initial}
        </RNText>
      </View>
      <RNText style={styles.name}>{member.display_name}</RNText>
      <RoleBadge role={member.role_name} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: calendarsUIColors.border,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { fontSize: 14, fontWeight: '700' },
  name: { flex: 1, fontSize: 15, fontWeight: '500', color: calendarsUIColors.text },
});
