import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { PowerSyncContext } from '@powersync/react';
import { PowerSyncDatabase } from '@powersync/react-native';
import { GluestackUIProvider } from '@components/ui/gluestack-ui-provider';
import { Center } from '@components/ui/center';
import { Spinner } from '@components/ui/spinner';
import { Text } from '@components/ui/text';
import { AppNavigator } from '@navigation/AppNavigator';
import { AuthProvider, useAuth } from '@hooks/useAuth';
import { initializeDatabase, disconnectDatabase } from '@database/database';

function DatabaseLoader() {
  const [database, setDatabase] = useState<PowerSyncDatabase | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeDatabase()
      .then(setDatabase)
      .catch((err) => {
        console.error('Failed to initialize database:', err);
        setError(err.message);
      });

    return () => {
      disconnectDatabase();
    };
  }, []);

  if (error) {
    return (
      <Center className="flex-1 bg-background">
        <Text className="text-error text-center px-5">Database Error: {error}</Text>
      </Center>
    );
  }

  if (!database) {
    return (
      <Center className="flex-1 bg-background">
        <Spinner size="large" />
        <Text className="mt-4 text-text-secondary">Initializing database...</Text>
      </Center>
    );
  }

  return (
    <PowerSyncContext.Provider value={database}>
      <AppNavigator />
    </PowerSyncContext.Provider>
  );
}

function AppRoot() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <AppNavigator />;
  }

  return <DatabaseLoader />;
}

export default function App() {
  return (
    <GluestackUIProvider>
      <AuthProvider>
        <StatusBar style="auto" />
        <AppRoot />
      </AuthProvider>
    </GluestackUIProvider>
  );
}
