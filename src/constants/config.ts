import Constants from 'expo-constants';

import { PowerSyncConfigSchema } from '@database/schemas';

const apiPort = Constants.expoConfig?.extra?.apiPort ?? '4000';
const powersyncPort = Constants.expoConfig?.extra?.powersyncPort ?? '8080';

export const powersyncConfig = PowerSyncConfigSchema.parse({
  powersyncUrl: __DEV__
    ? `http://localhost:${powersyncPort}`
    : 'https://YOUR_INSTANCE_ID.powersync.journeyapps.com',

  backendUrl: __DEV__ ? `http://localhost:${apiPort}` : 'https://your-backend-api.com',
});

/**
 * Clerk Publishable Key. Set via `CLERK_PUBLISHABLE_KEY` env var; surfaced
 * through `expo-constants` via `app.config.ts`.
 *
 * In dev: comes from `.env` (or your shell). In prod: bake into the build.
 */
export const clerkPublishableKey: string = Constants.expoConfig?.extra?.clerkPublishableKey ?? '';

/**
 * Sync status polling interval in milliseconds
 */
export const SYNC_STATUS_POLL_INTERVAL = 1000;
