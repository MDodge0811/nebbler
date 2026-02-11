import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { PowerSyncContext } from '@powersync/react';
import { PowerSyncDatabase } from '@powersync/react-native';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { Spinner } from '@/components/ui/spinner';
import { AppNavigator } from '@navigation/AppNavigator';
import { AuthProvider } from '@context/AuthContext';
import { initializeDatabase } from '@database/database';

import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import '@/global.css';

const loadingContainerStyle = tva({
  base: 'flex-1 items-center justify-center bg-background-0',
});
const loadingTextStyle = tva({ base: 'mt-4 text-base text-typography-600' });
const errorTextStyle = tva({ base: 'p-5 text-center text-base text-error-500' });

export default function App() {
  const [database, setDatabase] = useState<PowerSyncDatabase | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize PowerSync on app mount
    initializeDatabase()
      .then(setDatabase)
      .catch((err) => {
        console.error('Failed to initialize database:', err);
        setError(err.message);
      });
  }, []);

  // Show loading state while database initializes
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

  return (
    <GluestackUIProvider mode="light">
      <AuthProvider>
        <PowerSyncContext.Provider value={database}>
          <StatusBar style="auto" />
          <AppNavigator />
        </PowerSyncContext.Provider>
      </AuthProvider>
    </GluestackUIProvider>
  );
}
