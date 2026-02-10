import { Animated, Easing } from 'react-native';
import { useRef, useEffect } from 'react';
import { useSyncStatus, type SyncState } from '@hooks/useSyncStatus';
import { Box } from '@components/ui/box';
import { HStack } from '@components/ui/hstack';
import { VStack } from '@components/ui/vstack';
import { Text } from '@components/ui/text';
import { Divider } from '@components/ui/divider';
import { colors } from '@constants/colors';

const stateConfig: Record<SyncState, { color: string; label: string }> = {
  connecting: { color: colors.warning, label: 'Connecting...' },
  connected: { color: colors.success, label: 'Connected' },
  syncing: { color: colors.info, label: 'Syncing...' },
  synced: { color: colors.success, label: 'Synced' },
  offline: { color: colors.disabled, label: 'Offline' },
  error: { color: colors.error, label: 'Sync Error' },
};

interface SyncStatusIndicatorProps {
  detailed?: boolean;
  compact?: boolean;
}

export function SyncStatusIndicator({
  detailed = false,
  compact = false,
}: SyncStatusIndicatorProps) {
  const syncStatus = useSyncStatus();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const config = stateConfig[syncStatus.state];

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
        style={{
          width: 12,
          height: 12,
          borderRadius: 6,
          backgroundColor: config.color,
          opacity: pulseAnim,
        }}
      />
    );
  }

  return (
    <Box className="p-3 bg-background rounded-lg border border-border">
      <HStack space="sm" className="items-center">
        <Animated.View
          style={{
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: config.color,
            opacity: pulseAnim,
          }}
        />
        <Text className="text-sm font-medium">{config.label}</Text>
      </HStack>

      {detailed && (
        <VStack space="xs" className="mt-2 pt-2">
          <Divider />
          <Text size="xs" className="text-text-secondary mt-1">
            Connected: {syncStatus.isConnected ? 'Yes' : 'No'}
          </Text>
          <Text size="xs" className="text-text-secondary">
            Has Synced: {syncStatus.hasSynced ? 'Yes' : 'No'}
          </Text>
          {syncStatus.lastSyncedAt && (
            <Text size="xs" className="text-text-secondary">
              Last Sync: {syncStatus.lastSyncedAt.toLocaleTimeString()}
            </Text>
          )}
        </VStack>
      )}
    </Box>
  );
}
