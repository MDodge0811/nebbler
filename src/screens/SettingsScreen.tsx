import { useState } from 'react';
import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { Button, ButtonText, ButtonSpinner } from '@/components/ui/button';
import { SyncStatusIndicator } from '@components/SyncStatusIndicator';
import { useAuth } from '@hooks/useAuth';
import type { MainTabScreenProps } from '@navigation/types';

const containerStyle = tva({ base: 'flex-1 bg-background-0 p-6' });
const titleStyle = tva({ base: 'text-2xl font-bold text-typography-900' });
const sectionStyle = tva({ base: 'mt-6 gap-2' });
const labelStyle = tva({ base: 'text-sm text-typography-500' });
const valueStyle = tva({ base: 'text-base font-medium text-typography-900' });
const logoutContainerStyle = tva({ base: 'mt-8' });
const syncContainerStyle = tva({ base: 'mt-6' });

export function SettingsScreen(_props: MainTabScreenProps<'Settings'>) {
  const { user, clerkUser, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  const handleLogout = async () => {
    setSigningOut(true);
    try {
      await signOut();
      // ClerkPowerSyncBridge in App.tsx disconnects PowerSync when
      // isSignedIn flips to false. Navigation switches automatically.
    } finally {
      setSigningOut(false);
    }
  };

  const displayEmail = user?.email ?? clerkUser?.primaryEmailAddress?.emailAddress ?? '';

  return (
    <Box className={containerStyle({})}>
      <Text className={titleStyle({})}>Settings</Text>

      {displayEmail !== '' && (
        <VStack className={sectionStyle({})}>
          <Text className={labelStyle({})}>Email</Text>
          <Text className={valueStyle({})}>{displayEmail}</Text>
        </VStack>
      )}

      <Box className={syncContainerStyle({})}>
        <SyncStatusIndicator detailed />
      </Box>

      <Box className={logoutContainerStyle({})}>
        <Button
          variant="outline"
          action="negative"
          onPress={() => {
            void handleLogout();
          }}
          isDisabled={signingOut}
        >
          {signingOut && <ButtonSpinner />}
          <ButtonText>{signingOut ? 'Signing Out...' : 'Sign Out'}</ButtonText>
        </Button>
      </Box>
    </Box>
  );
}
