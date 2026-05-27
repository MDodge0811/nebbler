import { StyleSheet, Text as RNText, View } from 'react-native';
import { calendarsUIColors } from '@constants/calendarsUI';

export type RsvpStatus = 'going' | 'maybe' | 'not_going';

const CONFIGS: Record<RsvpStatus, { label: string; bg: string; color: string; border: string }> = {
  going: {
    label: 'Going',
    bg: calendarsUIColors.primaryLight,
    color: '#0A8F4F',
    border: calendarsUIColors.primaryBorder,
  },
  maybe: {
    label: 'Maybe',
    bg: '#FFF8EB',
    color: '#B8860B',
    border: '#FFE4A0',
  },
  not_going: {
    label: 'Not Going',
    bg: calendarsUIColors.dangerLight,
    color: '#CC4444',
    border: '#FFD4D4',
  },
};

interface RsvpBadgeProps {
  status: RsvpStatus | null | undefined;
}

export function RsvpBadge({ status }: RsvpBadgeProps) {
  if (!status) return null;
  const c = CONFIGS[status];
  if (!c) return null;
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
