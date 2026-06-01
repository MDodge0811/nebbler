import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { PeopleStackParamList } from '@navigation/types';

export function ConnectionsScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<PeopleStackParamList, 'Connections'>>();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connections (stub)</Text>
      <Pressable onPress={() => navigation.navigate('PersonProfile', { userId: 'test-user-id' })}>
        <Text style={styles.link}>Open PersonProfile (test)</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  title: { fontSize: 18, fontWeight: '600' },
  link: { color: '#00DB74', fontSize: 14 },
});
