import type { ExpoConfig } from 'expo/config';

import appJson from './app.json';

const apiPort = process.env.API_PORT || '4000';
const powersyncPort = process.env.POWERSYNC_PORT || '8080';

const config: ExpoConfig = {
  ...(appJson.expo as ExpoConfig),
  extra: {
    apiPort,
    powersyncPort,
  },
};

export default config;
