import { useNavigation } from '@react-navigation/native';
import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { Button, ButtonText } from '@/components/ui/button';

const containerStyle = tva({ base: 'flex-1 items-center justify-center bg-background-0 px-6' });
const titleStyle = tva({ base: 'text-xl font-bold text-typography-900' });
const bodyStyle = tva({ base: 'mt-2 text-center text-base text-typography-500' });

export function CreateEventScreen() {
  const navigation = useNavigation();

  return (
    <Box className={containerStyle({})}>
      <VStack className="items-center">
        <Text className={titleStyle({})}>Create Event</Text>
        <Text className={bodyStyle({})}>Coming soon</Text>
        <Button className="mt-6" onPress={() => navigation.goBack()}>
          <ButtonText>Close</ButtonText>
        </Button>
      </VStack>
    </Box>
  );
}
