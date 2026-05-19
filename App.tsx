import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { ClerkProvider, useAuth as useClerkAuth } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import { PowerSyncContext } from '@powersync/react';
import { PowerSyncDatabase } from '@powersync/react-native';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { Spinner } from '@/components/ui/spinner';
import { AppNavigator } from '@navigation/AppNavigator';
import {
  initializeDatabase,
  connectDatabase,
  disconnectDatabase,
  setClerkTokenGetter,
  clearClerkTokenGetter,
} from '@database/index';
import { clerkPublishableKey } from '@constants/config';

import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import '@/global.css';

const loadingContainerStyle = tva({
  base: 'flex-1 items-center justify-center bg-background-0',
});
const loadingTextStyle = tva({ base: 'mt-4 text-base text-typography-600' });
const errorTextStyle = tva({ base: 'p-5 text-center text-base text-error-500' });

/**
 * Bridges Clerk's auth state to PowerSync:
 *   - exposes Clerk's `getToken` to the connector module
 *   - calls `connectDatabase()` on sign-in, `disconnectDatabase()` on sign-out
 */
function ClerkPowerSyncBridge() {
  const { isSignedIn, isLoaded, getToken } = useClerkAuth();

  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn) {
      setClerkTokenGetter(getToken);
      connectDatabase().catch((err) => console.error('[App] connectDatabase failed:', err));
    } else {
      clearClerkTokenGetter();
      disconnectDatabase().catch((err) => console.error('[App] disconnectDatabase failed:', err));
    }
  }, [isSignedIn, isLoaded, getToken]);

  return null;
}

export default function App() {
  const [database, setDatabase] = useState<PowerSyncDatabase | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeDatabase()
      .then(setDatabase)
      .catch((err) => {
        console.error('Failed to initialize database:', err);
        setError(err.message);
      });
  }, []);

  if (!database) {
    return (
      <GluestackUIProvider mode="light">
        <Box className={loadingContainerStyle({})}>
          {error ? (
            <Text className={errorTextStyle({})}>Database Error: {error}</Text>
          ) : (
            <>
              <Spinner size="large" />
              <Text className={loadingTextStyle({})}>Initializing database...</Text>
            </>
          )}
        </Box>
      </GluestackUIProvider>
    );
  }

  if (!clerkPublishableKey) {
    return (
      <GluestackUIProvider mode="light">
        <Box className={loadingContainerStyle({})}>
          <Text className={errorTextStyle({})}>
            CLERK_PUBLISHABLE_KEY is not set. See .env.example.
          </Text>
        </Box>
      </GluestackUIProvider>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GluestackUIProvider mode="light">
        <ClerkProvider publishableKey={clerkPublishableKey} tokenCache={tokenCache}>
          <PowerSyncContext.Provider value={database}>
            <ClerkPowerSyncBridge />
            <StatusBar style="auto" />
            <AppNavigator />
          </PowerSyncContext.Provider>
        </ClerkProvider>
      </GluestackUIProvider>
    </GestureHandlerRootView>
  );
}
