import { PowerSyncConfigSchema } from '@database/schemas';

/**
 * PowerSync configuration
 *
 * For local development with Docker:
 * - PowerSync service runs on port 8080
 * - Phoenix API runs on port 4000
 *
 * For production, replace with your actual URLs.
 *
 * Validated at startup with Zod — throws if URLs are invalid.
 */
export const powersyncConfig = PowerSyncConfigSchema.parse({
  /**
   * PowerSync instance URL
   * Local: http://localhost:8080
   * Production: https://<instance-id>.powersync.journeyapps.com
   */
  powersyncUrl: __DEV__
    ? 'http://localhost:8080'
    : 'https://YOUR_INSTANCE_ID.powersync.journeyapps.com',

  /**
   * Backend API URL for authentication and write operations
   * Local: http://localhost:4000
   * Production: Your deployed API URL
   */
  backendUrl: __DEV__ ? 'http://localhost:4000' : 'https://your-backend-api.com',
});

/**
 * Sync status polling interval in milliseconds
 */
export const SYNC_STATUS_POLL_INTERVAL = 1000;
