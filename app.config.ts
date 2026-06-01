import type { ExpoConfig } from 'expo/config';

import appJson from './app.json';

const env = process.env as Record<string, string | undefined>;
// `||` (not `??`) is intentional: a present-but-empty env var must fall back to the
// default port, otherwise the URL becomes `http://localhost:` with no port.
/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
const apiPort: string = env['API_PORT'] || '4000';
const powersyncPort: string = env['POWERSYNC_PORT'] || '8080';
/* eslint-enable @typescript-eslint/prefer-nullish-coalescing */

// Home-screen label: when several worktrees/branches run on the simulator at once,
// label each by its branch so they're distinguishable. APP_LABEL overrides; main
// (or any detection failure) falls back to "Nebbler". iOS truncates to ~12 chars.
function resolveAppLabel(): string {
  if (env['APP_LABEL']) return env['APP_LABEL'];
  try {
    const childProcess = require('child_process') as {
      execSync: (cmd: string, opts: { encoding: string }) => string;
    };
    const branch = childProcess
      .execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' })
      .trim();
    if (!branch || branch === 'HEAD' || branch === 'main') return 'Nebbler';
    // Use the leaf segment: `worktree/feature-x` -> `feature-x`.
    const leaf = branch.split('/').pop();
    return leaf ?? 'Nebbler';
  } catch {
    return 'Nebbler';
  }
}

const appLabel = resolveAppLabel();

// Clerk publishable key is read directly from process.env at runtime by the
// Clerk SDK — using the EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY env var so Expo
// auto-exposes it to the client bundle. See:
// https://clerk.com/docs/expo/getting-started/quickstart

const baseExpo = appJson.expo as ExpoConfig;

const config: ExpoConfig = {
  ...baseExpo,
  ios: {
    ...baseExpo.ios,
    infoPlist: {
      ...baseExpo.ios?.infoPlist,
      // Drives the iOS home-screen label only. We deliberately do NOT change
      // `expo.name`, so the native product/scheme and the built `Nebbler.app`
      // artifact name stay stable (bin/start-users matches it by bundle id).
      CFBundleDisplayName: appLabel,
    },
  },
  extra: {
    apiPort,
    powersyncPort,
  },
};

export default config;
