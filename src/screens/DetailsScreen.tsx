import type { RootStackScreenProps } from '@navigation/types';
import { Center } from '@components/ui/center';
import { Heading } from '@components/ui/heading';
import { Text } from '@components/ui/text';

export function DetailsScreen({ route }: RootStackScreenProps<'Details'>) {
  const { itemId, title } = route.params;

  return (
    <Center className="flex-1 bg-background">
      <Heading size="xl">{title}</Heading>
      <Text className="text-text-secondary mt-2">Item ID: {itemId}</Text>
    </Center>
  );
}
