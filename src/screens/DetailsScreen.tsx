import { View, Text, StyleSheet } from 'react-native';
import type { RootStackScreenProps } from '@navigation/types';
import { colors } from '@constants/colors';

export function DetailsScreen({ route }: RootStackScreenProps<'Details'>) {
  const { itemId, title } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>Item ID: {itemId}</Text>
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
  subtitle: {
    fontSize: 16,
    marginTop: 10,
    color: colors.text.secondary,
  },
});
