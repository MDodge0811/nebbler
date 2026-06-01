import { View, Text, StyleSheet } from 'react-native';

export function AddConnectionScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Connection (stub)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '600' },
});
