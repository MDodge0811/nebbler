import { StyleSheet, Text as RNText, View } from 'react-native';
import { calendarsUIColors } from '@constants/calendarsUI';

export type CalendarRole = 'owner' | 'admin' | 'member';

const CONFIGS: Record<CalendarRole, { label: string; bg: string; color: string; border: string }> =
  {
    owner: {
      label: 'Owner',
      bg: calendarsUIColors.primaryLight,
      color: '#0A8F4F',
      border: calendarsUIColors.primaryBorder,
    },
    admin: {
      label: 'Admin',
      bg: '#EDE9FE',
      color: '#7C3AED',
      border: '#DDD6FE',
    },
    member: {
      label: 'Member',
      bg: calendarsUIColors.surfaceHover,
      color: calendarsUIColors.textSecondary,
      border: calendarsUIColors.border,
    },
  };

interface RoleBadgeProps {
  role: CalendarRole | string;
}

export function RoleBadge({ role }: RoleBadgeProps) {
  const c = (CONFIGS as Record<string, (typeof CONFIGS)[CalendarRole]>)[role] ?? CONFIGS.member;
  return (
    <View style={[styles.badge, { backgroundColor: c.bg, borderColor: c.border }]}>
      <RNText style={[styles.label, { color: c.color }]}>{c.label}</RNText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  label: { fontSize: 11, fontWeight: '600', letterSpacing: 0.2 },
});
