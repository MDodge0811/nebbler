import { useStatus } from '@powersync/react';

/**
 * Sync status states for UI display
 */
export type SyncState = 'connecting' | 'connected' | 'syncing' | 'synced' | 'offline' | 'error';

/**
 * Detailed sync status information
 */
export interface SyncStatusInfo {
  state: SyncState;
  isConnected: boolean;
  isSyncing: boolean;
  hasSynced: boolean;
  lastSyncedAt: Date | null;
  uploadQueueCount: number;
  downloadProgress: number | null;
  error: Error | null;
}

/**
 * Custom hook for accessing PowerSync sync status
 * Provides a simplified interface for common sync status needs
 */
export function useSyncStatus(): SyncStatusInfo {
  const status = useStatus();

  // Determine the current sync state
  const getSyncState = (): SyncState => {
    if (!status.connected && !status.hasSynced) {
      return 'connecting';
    }
    if (!status.connected) {
      return 'offline';
    }
    if (status.dataFlowStatus?.downloading) {
      return 'syncing';
    }
    if (status.hasSynced) {
      return 'synced';
    }
    return 'connected';
  };

  return {
    state: getSyncState(),
    isConnected: status.connected,
    isSyncing: status.dataFlowStatus?.downloading ?? false,
    hasSynced: status.hasSynced ?? false,
    lastSyncedAt: status.lastSyncedAt ?? null,
    uploadQueueCount: status.dataFlowStatus?.uploading ? 1 : 0, // Simplified
    downloadProgress: null, // PowerSync doesn't provide granular progress
    error: null, // Would need error boundary integration
  };
}

/**
 * Hook to check if there are pending uploads
 * Useful for showing "changes pending" indicators
 */
export function useHasPendingChanges(): boolean {
  const status = useStatus();
  return status.dataFlowStatus?.uploading ?? false;
}
