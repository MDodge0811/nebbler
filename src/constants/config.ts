import Constants from 'expo-constants';

import { PowerSyncConfigSchema } from '@database/schemas';

// Constants.expoConfig.extra is typed as `any` by expo-constants — cast to a
// typed record at the boundary so downstream code is fully typed.
const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;
// `||` (not `??`) is intentional: a present-but-empty value must fall back to the
// default port, otherwise the URL becomes `http://localhost:` with no port.
/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
const apiPort: string = extra['apiPort'] || '4000';
const powersyncPort: string = extra['powersyncPort'] || '8080';
/* eslint-enable @typescript-eslint/prefer-nullish-coalescing */

export const powersyncConfig = PowerSyncConfigSchema.parse({
  powersyncUrl: __DEV__
    ? `http://localhost:${powersyncPort}`
    : 'https://YOUR_INSTANCE_ID.powersync.journeyapps.com',

  backendUrl: __DEV__ ? `http://localhost:${apiPort}` : 'https://your-backend-api.com',
});

/**
 * Sync status polling interval in milliseconds
 */
export const SYNC_STATUS_POLL_INTERVAL = 1000;
