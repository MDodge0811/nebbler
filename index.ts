// Polyfills must be imported first, before any other imports.
// Intentional non-standard import order: polyfills must load before all other modules
// (including expo) to guarantee side-effect execution order at boot.
import '@azure/core-asynciterator-polyfill';
import { polyfill as polyfillEncoding } from 'react-native-polyfill-globals/src/encoding';
// eslint-disable-next-line import-x/order
import { polyfill as polyfillReadableStream } from 'react-native-polyfill-globals/src/readable-stream';

// Note: We don't polyfill fetch - React Native's native fetch works fine
// and the polyfill causes "blobId" errors with some responses
polyfillEncoding();
polyfillReadableStream();

// eslint-disable-next-line import-x/order
import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
