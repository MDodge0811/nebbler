import { View, Text, Button, StyleSheet } from 'react-native';
import type { MainTabScreenProps } from '@navigation/types';
import { colors } from '@constants/colors';

export function HomeScreen({ navigation }: MainTabScreenProps<'Home'>) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home Screen</Text>
      <Button
        title="Go to Details"
        onPress={() =>
          navigation.navigate('Details', {
            itemId: 42,
            title: 'Example Item',
          })
        }
      />
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
    marginBottom: 20,
    color: colors.text.primary,
  },
});
