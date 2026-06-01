import { StyleSheet, Switch, Text as RNText, View } from 'react-native';

import { calendarsUIColors } from '@constants/calendarsUI';

interface ToggleRowProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: string;
}

export function ToggleRow({ checked, onChange, label, description }: ToggleRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <RNText style={styles.label}>{label}</RNText>
        {description ? <RNText style={styles.description}>{description}</RNText> : null}
      </View>
      <Switch
        value={checked}
        onValueChange={onChange}
        trackColor={{ false: calendarsUIColors.border, true: calendarsUIColors.primary }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
    backgroundColor: calendarsUIColors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: calendarsUIColors.border,
  },
  text: { flex: 1 },
  label: { fontSize: 15, fontWeight: '600', color: calendarsUIColors.text },
  description: {
    fontSize: 13,
    color: calendarsUIColors.textSecondary,
    marginTop: 3,
    lineHeight: 18,
  },
});
