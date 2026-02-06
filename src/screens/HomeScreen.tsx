import { View, Text, FlatList, Button, StyleSheet, TouchableOpacity } from 'react-native';
import type { MainTabScreenProps } from '@navigation/types';
import { colors } from '@constants/colors';
import { SyncStatusIndicator } from '@components/SyncStatusIndicator';
import { useTestItems, useTestItemMutations } from '@hooks/useTestItems';
import type { TestItem } from '@database/schema';

export function HomeScreen({ navigation }: MainTabScreenProps<'Home'>) {
  const { data: testItems, isLoading, error } = useTestItems();
  const { createItem, toggleComplete, deleteItem } = useTestItemMutations();

  const handleAddItem = async () => {
    await createItem(`Test Item ${Date.now()}`, 'Created from React Native app');
  };

  const renderItem = ({ item }: { item: TestItem }) => (
    <TouchableOpacity
      style={styles.itemRow}
      onPress={() => toggleComplete(item.id, item.completed ?? 0)}
      onLongPress={() => deleteItem(item.id)}
    >
      <View style={[styles.checkbox, item.completed === 1 && styles.checked]} />
      <View style={styles.itemContent}>
        <Text style={[styles.itemName, item.completed === 1 && styles.completedText]}>
          {item.name}
        </Text>
        <Text style={styles.itemDescription}>{item.description}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <SyncStatusIndicator detailed />

      <View style={styles.content}>
        <Text style={styles.title}>Test Items</Text>

        {isLoading && <Text style={styles.loadingText}>Loading...</Text>}
        {error && <Text style={styles.errorText}>Error: {error.message}</Text>}

        <FlatList
          data={testItems}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          style={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No items yet. Add one or wait for sync.</Text>
          }
        />

        <View style={styles.buttonContainer}>
          <Button title="Add Test Item" onPress={handleAddItem} />
        </View>

        <View style={styles.buttonContainer}>
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  content: {
    flex: 1,
    marginTop: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: colors.text.primary,
  },
  list: {
    flex: 1,
    marginBottom: 16,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: 8,
    marginBottom: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.text.secondary,
    marginRight: 12,
  },
  checked: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: colors.text.secondary,
  },
  itemDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.text.secondary,
    marginTop: 32,
  },
  loadingText: {
    textAlign: 'center',
    color: colors.text.secondary,
    marginBottom: 16,
  },
  errorText: {
    color: colors.error,
    marginBottom: 16,
  },
  buttonContainer: {
    marginBottom: 12,
  },
});
