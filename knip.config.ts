import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  entry: ['App.tsx'],
  project: ['src/**/*.{ts,tsx}'],
  ignore: [
    'babel.config.js',
    'eslint.config.js',
    'jest.config.js',
    'jest.setup.js',
    'commitlint.config.js',
    'knip.config.ts',
  ],
  ignoreDependencies: [
    'babel-preset-expo',
    'babel-plugin-module-resolver',
    // Peer dependency required by @testing-library/react-native
    'react-test-renderer',
    // Used in test files but not yet imported in source
    '@testing-library/react-native',
  ],
  ignoreExportsUsedInFile: true,
};

export default config;
