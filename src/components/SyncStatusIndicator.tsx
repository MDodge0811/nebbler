import { Animated, Easing } from 'react-native';
import { useRef, useEffect } from 'react';
import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { useSyncStatus, SyncState } from '@hooks/useSyncStatus';
import { syncDotColors } from '@constants/theme';

/**
 * Configuration for each sync state
 * Dot colors use hex values (required by Animated.View style)
 */
const stateConfig: Record<SyncState, { color: string; label: string }> = {
  connecting: { color: syncDotColors.connecting, label: 'Connecting...' },
  connected: { color: syncDotColors.connected, label: 'Connected' },
  syncing: { color: syncDotColors.syncing, label: 'Syncing...' },
  synced: { color: syncDotColors.synced, label: 'Synced' },
  offline: { color: syncDotColors.offline, label: 'Offline' },
  error: { color: syncDotColors.error, label: 'Sync Error' },
};

const containerStyle = tva({
  base: 'rounded-lg border border-outline-200 bg-background-0 p-3',
});
const dotStyle = tva({ base: 'h-3 w-3 rounded-full' });
const labelStyle = tva({ base: 'ml-2 text-sm font-medium text-typography-900' });
const detailsContainerStyle = tva({ base: 'mt-2 border-t border-outline-200 pt-2' });
const detailTextStyle = tva({ base: 'mt-1 text-xs text-typography-600' });
const statusRowStyle = tva({ base: 'items-center' });

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
      <Animated.View
        className={dotStyle({})}
        style={{ backgroundColor: config.color, opacity: pulseAnim }}
      />
    );
  }

  return (
    <Box className={containerStyle({})}>
      <HStack className={statusRowStyle({})}>
        <Animated.View
          className={dotStyle({})}
          style={{ backgroundColor: config.color, opacity: pulseAnim }}
        />
        <Text className={labelStyle({})}>{config.label}</Text>
      </HStack>

      {detailed && (
        <VStack className={detailsContainerStyle({})}>
          <Text className={detailTextStyle({})}>
            Connected: {syncStatus.isConnected ? 'Yes' : 'No'}
          </Text>
          <Text className={detailTextStyle({})}>
            Has Synced: {syncStatus.hasSynced ? 'Yes' : 'No'}
          </Text>
          {syncStatus.lastSyncedAt && (
            <Text className={detailTextStyle({})}>
              Last Sync: {syncStatus.lastSyncedAt.toLocaleTimeString()}
            </Text>
          )}
        </VStack>
      )}
    </Box>
  );
}
