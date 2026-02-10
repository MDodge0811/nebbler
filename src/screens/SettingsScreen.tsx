import type { MainTabScreenProps } from '@navigation/types';
import { Box } from '@components/ui/box';
import { VStack } from '@components/ui/vstack';
import { Heading } from '@components/ui/heading';
import { Divider } from '@components/ui/divider';
import { Button, ButtonText } from '@components/ui/button';
import { useAuth } from '@hooks/useAuth';

export function SettingsScreen(_props: MainTabScreenProps<'Settings'>) {
  const { signOut, user } = useAuth();

  return (
    <Box className="flex-1 bg-background p-4">
      <VStack space="lg">
        <Heading size="xl">Settings</Heading>
        {user && (
          <Box className="bg-surface p-3 rounded-lg">
            <Heading size="sm" className="text-text-secondary">
              Signed in as {user.email}
            </Heading>
          </Box>
        )}
        <Divider />
        <Button action="negative" onPress={signOut}>
          <ButtonText>Sign Out</ButtonText>
        </Button>
      </VStack>
    </Box>
  );
}
