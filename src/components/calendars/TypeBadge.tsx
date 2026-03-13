import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/text';

const BADGE_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  social: { bg: '#E8F7FC', color: '#0090B0', label: 'Social' },
  public: { bg: '#F0EBFF', color: '#7C5CC4', label: 'Public' },
};

interface TypeBadgeProps {
  type: string | null;
}

export function TypeBadge({ type }: TypeBadgeProps) {
  if (!type || type === 'private') return null;
  const config = BADGE_STYLES[type];
  if (!config) return null;

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
