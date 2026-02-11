import { FlatList } from 'react-native';
import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { Button, ButtonText } from '@/components/ui/button';
import { Pressable } from '@/components/ui/pressable';
import type { MainTabScreenProps } from '@navigation/types';
import { SyncStatusIndicator } from '@components/SyncStatusIndicator';
import { useTestItems, useTestItemMutations } from '@hooks/useTestItems';
import type { TestItem } from '@database/schema';

const containerStyle = tva({ base: 'flex-1 bg-background-0 p-4' });
const contentStyle = tva({ base: 'mt-4 flex-1' });
const titleStyle = tva({ base: 'mb-4 text-2xl font-bold text-typography-900' });
const listStyle = tva({ base: 'mb-4 flex-1' });
const itemRowStyle = tva({ base: 'mb-2 flex-row items-center rounded-lg bg-background-50 p-3' });
const checkboxStyle = tva({
  base: 'h-6 w-6 rounded-full border-2',
  variants: {
    checked: {
      true: 'border-success-500 bg-success-500',
      false: 'border-typography-600',
    },
  },
});
const itemContentStyle = tva({ base: 'ml-3 flex-1' });
const itemNameStyle = tva({
  base: 'text-base font-medium',
  variants: {
    completed: {
      true: 'text-typography-600 line-through',
      false: 'text-typography-900',
    },
  },
});
const itemDescriptionStyle = tva({ base: 'mt-1 text-sm text-typography-600' });
const emptyTextStyle = tva({ base: 'mt-8 text-center text-typography-600' });
const loadingTextStyle = tva({ base: 'mb-4 text-center text-typography-600' });
const errorTextStyle = tva({ base: 'mb-4 text-error-500' });
const buttonContainerStyle = tva({ base: 'mb-3' });

export function HomeScreen({ navigation }: MainTabScreenProps<'Home'>) {
  const { data: testItems, isLoading, error } = useTestItems();
  const { createItem, toggleComplete, deleteItem } = useTestItemMutations();

  const handleAddItem = async () => {
    await createItem(`Test Item ${Date.now()}`, 'Created from React Native app');
  };

  const renderItem = ({ item }: { item: TestItem }) => (
    <Pressable
      className={itemRowStyle({})}
      onPress={() => toggleComplete(item.id, item.completed ?? 0)}
      onLongPress={() => deleteItem(item.id)}
    >
      <Box className={checkboxStyle({ checked: item.completed === 1 })} />
      <VStack className={itemContentStyle({})}>
        <Text className={itemNameStyle({ completed: item.completed === 1 })}>{item.name}</Text>
        <Text className={itemDescriptionStyle({})}>{item.description}</Text>
      </VStack>
    </Pressable>
  );

  return (
    <Box className={containerStyle({})}>
      <SyncStatusIndicator detailed />

      <VStack className={contentStyle({})}>
        <Text className={titleStyle({})}>Test Items</Text>

        {isLoading && <Text className={loadingTextStyle({})}>Loading...</Text>}
        {error && <Text className={errorTextStyle({})}>Error: {error.message}</Text>}

        <FlatList
          data={testItems}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          className={listStyle({})}
          ListEmptyComponent={
            <Text className={emptyTextStyle({})}>No items yet. Add one or wait for sync.</Text>
          }
        />

        <Box className={buttonContainerStyle({})}>
          <Button onPress={handleAddItem}>
            <ButtonText>Add Test Item</ButtonText>
          </Button>
        </Box>

        <Box className={buttonContainerStyle({})}>
          <Button
            variant="outline"
            onPress={() =>
              navigation.navigate('Details', {
                itemId: 42,
                title: 'Example Item',
              })
            }
          >
            <ButtonText>Go to Details</ButtonText>
          </Button>
        </Box>
      </VStack>
    </Box>
  );
}
