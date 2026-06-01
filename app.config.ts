import type { ExpoConfig } from 'expo/config';

import appJson from './app.json';

const env = process.env as Record<string, string | undefined>;
// `||` (not `??`) is intentional: a present-but-empty env var must fall back to the
// default port, otherwise the URL becomes `http://localhost:` with no port.
/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
const apiPort: string = env['API_PORT'] || '4000';
const powersyncPort: string = env['POWERSYNC_PORT'] || '8080';
/* eslint-enable @typescript-eslint/prefer-nullish-coalescing */

// Clerk publishable key is read directly from process.env at runtime by the
// Clerk SDK — using the EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY env var so Expo
// auto-exposes it to the client bundle. See:
// https://clerk.com/docs/expo/getting-started/quickstart

const config: ExpoConfig = {
  ...(appJson.expo as ExpoConfig),
  extra: {
    apiPort,
    powersyncPort,
  },
};

export default config;
