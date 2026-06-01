import { useRoute, type RouteProp } from '@react-navigation/native';
import { View, Text, StyleSheet } from 'react-native';
import type { PeopleStackParamList } from '@navigation/types';

export function PersonProfileScreen() {
  const route = useRoute<RouteProp<PeopleStackParamList, 'PersonProfile'>>();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Person Profile (stub)</Text>
      <Text style={styles.id}>userId: {route.params.userId}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  title: { fontSize: 18, fontWeight: '600' },
  id: { fontSize: 13, color: '#666' },
});
