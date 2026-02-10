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
    'metro.config.js',
    'tailwind.config.js',
    '__mocks__/styleMock.js',
  ],
  ignoreDependencies: [
    'babel-preset-expo',
    'babel-plugin-module-resolver',
    // Peer dependency required by @testing-library/react-native
    'react-test-renderer',
    // Used in test files but not yet imported in source
    '@testing-library/react-native',
    // NativeWind / Gluestack styling dependencies (used via babel preset and metro plugin)
    'nativewind',
    'tailwindcss',
    'react-native-css-interop',
    'react-native-reanimated',
    '@expo/html-elements',
  ],
  ignoreExportsUsedInFile: true,
};

export default config;
