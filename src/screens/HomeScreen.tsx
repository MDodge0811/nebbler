import { FlatList } from 'react-native';
import type { MainTabScreenProps } from '@navigation/types';
import { SyncStatusIndicator } from '@components/SyncStatusIndicator';
import { useTestItems, useTestItemMutations } from '@hooks/useTestItems';
import type { TestItem } from '@database/schema';
import { Box } from '@components/ui/box';
import { Heading } from '@components/ui/heading';
import { Text } from '@components/ui/text';
import { Pressable } from '@components/ui/pressable';
import { Button, ButtonText } from '@components/ui/button';

export function HomeScreen({ navigation }: MainTabScreenProps<'Home'>) {
  const { data: testItems, isLoading, error } = useTestItems();
  const { createItem, toggleComplete, deleteItem } = useTestItemMutations();

  const handleAddItem = async () => {
    await createItem(`Test Item ${Date.now()}`, 'Created from React Native app');
  };

  const renderItem = ({ item }: { item: TestItem }) => (
    <Pressable
      className="flex-row items-center p-3 bg-surface rounded-lg mb-2"
      onPress={() => toggleComplete(item.id, item.completed ?? 0)}
      onLongPress={() => deleteItem(item.id)}
    >
      <Box
        className={`w-6 h-6 rounded-full border-2 mr-3 ${
          item.completed === 1 ? 'bg-success border-success' : 'border-text-secondary'
        }`}
      />
      <Box className="flex-1">
        <Text
          className={
            item.completed === 1
              ? 'text-base font-medium line-through text-text-secondary'
              : 'text-base font-medium'
          }
        >
          {item.name}
        </Text>
        <Text size="sm" className="text-text-secondary mt-1">
          {item.description}
        </Text>
      </Box>
    </Pressable>
  );

  return (
    <Box className="flex-1 bg-background p-4">
      <SyncStatusIndicator detailed />

      <Box className="flex-1 mt-4">
        <Heading size="xl" className="mb-4">
          Test Items
        </Heading>

        {isLoading && <Text className="text-center text-text-secondary mb-4">Loading...</Text>}
        {error && <Text className="text-error mb-4">Error: {error.message}</Text>}

        <FlatList
          data={testItems}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          className="flex-1 mb-4"
          ListEmptyComponent={
            <Text className="text-center text-text-secondary mt-8">
              No items yet. Add one or wait for sync.
            </Text>
          }
        />

        <Box className="mb-3">
          <Button onPress={handleAddItem}>
            <ButtonText>Add Test Item</ButtonText>
          </Button>
        </Box>

        <Box className="mb-3">
          <Button
            variant="outline"
            onPress={() =>
              navigation.navigate('Details', {
                itemId: 42,
                title: 'Example Item',
              })
            }
          >
            <ButtonText className="text-text-primary">Go to Details</ButtonText>
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
