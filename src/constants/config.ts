/**
 * PowerSync configuration
 * Replace placeholder values with actual PowerSync instance details
 */
export const powersyncConfig = {
  /**
   * PowerSync instance URL
   * Format: https://<instance-id>.powersync.journeyapps.com
   * Obtain from PowerSync dashboard after creating instance
   */
  powersyncUrl: 'https://YOUR_INSTANCE_ID.powersync.journeyapps.com',

  /**
   * Backend API URL for authentication and write operations
   * This is your backend server that handles:
   * - JWT token generation for PowerSync authentication
   * - Processing uploaded changes from the device
   */
  backendUrl: 'https://your-backend-api.com',
} as const;

/**
 * Sync status polling interval in milliseconds
 */
export const SYNC_STATUS_POLL_INTERVAL = 1000;
