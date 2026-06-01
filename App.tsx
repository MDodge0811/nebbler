import { useEffect, useRef, useState } from 'react';
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

// Clerk's Expo SDK auto-reads this env var. Expo exposes any var prefixed
// with `EXPO_PUBLIC_` to the client bundle at build time.
// https://clerk.com/docs/expo/getting-started/quickstart
const clerkPublishableKey: string =
  (process.env as Record<string, string | undefined>)['EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY'] ?? '';

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
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn) {
      setClerkTokenGetter((...args) => getTokenRef.current(...args));
      connectDatabase().catch((err) => console.error('[App] connectDatabase failed:', err));
    } else {
      clearClerkTokenGetter();
      disconnectDatabase().catch((err) => console.error('[App] disconnectDatabase failed:', err));
    }
    // getToken intentionally omitted — Clerk does not stabilize the reference; connect/disconnect
    // should only trigger on auth state changes, not token function identity changes.
  }, [isSignedIn, isLoaded]);

  return null;
}

export default function App() {
  const [database, setDatabase] = useState<PowerSyncDatabase | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeDatabase()
      .then(setDatabase)
      .catch((err: unknown) => {
        console.error('Failed to initialize database:', err);
        setError(err instanceof Error ? err.message : String(err));
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
            EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY is not set. See .env.example.
          </Text>
        </Box>
      </GluestackUIProvider>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GluestackUIProvider mode="light">
        <ClerkProvider {...(tokenCache ? { tokenCache } : {})}>
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
