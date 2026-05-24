import type { ExpoConfig } from 'expo/config';

import appJson from './app.json';

const apiPort = process.env.API_PORT || '4000';
const powersyncPort = process.env.POWERSYNC_PORT || '8080';

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
