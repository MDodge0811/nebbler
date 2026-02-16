import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { Button, ButtonText, ButtonSpinner } from '@/components/ui/button';
import { useAuth } from '@hooks/useAuth';
import { useLogout } from '@hooks/useAuthMutations';
import type { MainTabScreenProps } from '@navigation/types';

const containerStyle = tva({ base: 'flex-1 bg-background-0 p-6' });
const titleStyle = tva({ base: 'text-2xl font-bold text-typography-900' });
const sectionStyle = tva({ base: 'mt-6 gap-2' });
const labelStyle = tva({ base: 'text-sm text-typography-500' });
const valueStyle = tva({ base: 'text-base font-medium text-typography-900' });
const logoutContainerStyle = tva({ base: 'mt-8' });

export function SettingsScreen(_props: MainTabScreenProps<'Settings'>) {
  const { user } = useAuth();
  const logoutMutation = useLogout();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <Box className={containerStyle({})}>
      <Text className={titleStyle({})}>Settings</Text>

      {user && (
        <VStack className={sectionStyle({})}>
          <Text className={labelStyle({})}>Email</Text>
          <Text className={valueStyle({})}>{user.email}</Text>
        </VStack>
      )}

      <Box className={logoutContainerStyle({})}>
        <Button
          variant="outline"
          action="negative"
          onPress={handleLogout}
          isDisabled={logoutMutation.isPending}
        >
          {logoutMutation.isPending && <ButtonSpinner />}
          <ButtonText>{logoutMutation.isPending ? 'Signing Out...' : 'Sign Out'}</ButtonText>
        </Button>
      </Box>
    </Box>
  );
}
