import { StyleSheet, Text as RNText, View } from 'react-native';

const ICONS: Record<string, string> = {
  private: '🔒',
  social: '👥',
  public: '🌐',
};

interface CalendarTypeBadgeProps {
  type: 'private' | 'social' | 'public' | string;
  color: string;
}

export function CalendarTypeBadge({ type, color }: CalendarTypeBadgeProps) {
  const label = type.charAt(0).toUpperCase() + type.slice(1);
  return (
    <View style={[styles.badge, { backgroundColor: `${color}14`, borderColor: `${color}30` }]}>
      <RNText style={styles.icon}>{ICONS[type] ?? ''}</RNText>
      <RNText style={[styles.label, { color }]}>{label}</RNText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  icon: { fontSize: 11 },
  label: { fontSize: 12, fontWeight: '600', letterSpacing: 0.2 },
});
