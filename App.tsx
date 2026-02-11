import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { PowerSyncContext } from '@powersync/react';
import { PowerSyncDatabase } from '@powersync/react-native';
import { AppNavigator } from '@navigation/AppNavigator';
import { initializeDatabase } from '@database/database';
import { colors } from '@constants/colors';

import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import '@/global.css';

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
      <GluestackUIProvider mode="dark">
        <View style={styles.loadingContainer}>
          {error ? (
            <Text style={styles.errorText}>Database Error: {error}</Text>
          ) : (
            <>
              <ActivityIndicator size="large" color={colors.text.primary} />
              <Text style={styles.loadingText}>Initializing database...</Text>
            </>
          )}
        </View>
      </GluestackUIProvider>
    );
  }

  return (
    <PowerSyncContext.Provider value={database}>
      <StatusBar style="auto" />
      <AppNavigator />
    </PowerSyncContext.Provider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text.secondary,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
    padding: 20,
  },
});
