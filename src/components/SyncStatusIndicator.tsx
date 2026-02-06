import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { useRef, useEffect } from 'react';
import { useSyncStatus, SyncState } from '@hooks/useSyncStatus';
import { colors } from '@constants/colors';

/**
 * Configuration for each sync state
 * Uses colors from the theme constants
 */
const stateConfig: Record<SyncState, { color: string; label: string }> = {
  connecting: { color: colors.warning, label: 'Connecting...' },
  connected: { color: colors.success, label: 'Connected' },
  syncing: { color: colors.info, label: 'Syncing...' },
  synced: { color: colors.success, label: 'Synced' },
  offline: { color: colors.disabled, label: 'Offline' },
  error: { color: colors.error, label: 'Sync Error' },
};

interface SyncStatusIndicatorProps {
  /**
   * Show detailed status information
   * @default false
   */
  detailed?: boolean;

  /**
   * Compact mode shows only the dot indicator
   * @default false
   */
  compact?: boolean;
}

/**
 * Visual indicator for PowerSync sync status
 * Shows connection state and sync activity
 */
export function SyncStatusIndicator({
  detailed = false,
  compact = false,
}: SyncStatusIndicatorProps) {
  const syncStatus = useSyncStatus();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const config = stateConfig[syncStatus.state];

  // Pulse animation for syncing state
  useEffect(() => {
    if (syncStatus.state === 'syncing' || syncStatus.state === 'connecting') {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.4,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [syncStatus.state, pulseAnim]);

  if (compact) {
    return (
      <Animated.View style={[styles.dot, { backgroundColor: config.color, opacity: pulseAnim }]} />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.statusRow}>
        <Animated.View
          style={[styles.dot, { backgroundColor: config.color, opacity: pulseAnim }]}
        />
        <Text style={styles.label}>{config.label}</Text>
      </View>

      {detailed && (
        <View style={styles.detailsContainer}>
          <Text style={styles.detailText}>Connected: {syncStatus.isConnected ? 'Yes' : 'No'}</Text>
          <Text style={styles.detailText}>Has Synced: {syncStatus.hasSynced ? 'Yes' : 'No'}</Text>
          {syncStatus.lastSyncedAt && (
            <Text style={styles.detailText}>
              Last Sync: {syncStatus.lastSyncedAt.toLocaleTimeString()}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  label: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
  },
  detailsContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  detailText: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 4,
  },
});
