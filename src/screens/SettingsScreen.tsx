import { View, Text, StyleSheet } from 'react-native';
import type { MainTabScreenProps } from '@navigation/types';
import { colors } from '@constants/colors';

export function SettingsScreen(_props: MainTabScreenProps<'Settings'>) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
});
