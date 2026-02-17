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
    'global.css',
    'nativewind-env.d.ts',
    'components/ui/**',
    '__mocks__/**',
  ],
  ignoreDependencies: [
    'babel-preset-expo',
    'babel-plugin-module-resolver',
    // Peer dependency required by @testing-library/react-native
    'react-test-renderer',
    // Used in test files but not yet imported in source
    '@testing-library/react-native',
    // Gluestack UI / NativeWind peer dependencies and implicit usage
    '@expo/html-elements',
    '@gluestack-ui/core',
    '@legendapp/motion',
    // Peer dependency required by @react-aria/utils
    'react-dom',
    'prettier-plugin-tailwindcss',
    'react-aria',
    'react-native-reanimated',
    'react-native-svg',
    'react-native-calendars',
    'react-native-worklets',
    'react-stately',
    'tailwind-variants',
  ],
  ignoreExportsUsedInFile: true,
};

export default config;
