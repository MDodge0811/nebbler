// Set __DEV__ global for tests (matches Expo development behavior)
global.__DEV__ = true;

// Mock NativeWind (CSS-in-JS runtime not available in Jest)
jest.mock('nativewind', () => ({
  useColorScheme: () => ({ colorScheme: 'light', setColorScheme: jest.fn() }),
  vars: jest.fn((obj) => obj),
  cssInterop: jest.fn(),
}));

// Mock expo-secure-store (native module not available in Jest)
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

// Mock native modules that cannot be loaded in Jest
jest.mock('@op-engineering/op-sqlite', () => ({}));
jest.mock('@powersync/op-sqlite', () => ({
  OPSqliteOpenFactory: jest.fn(),
}));

// Mock react-native-safe-area-context (native module not available in Jest)
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaView: ({ children }) => children,
  SafeAreaProvider: ({ children }) => children,
}));

// Mock react-native-calendars (complex gestures + calendar UI not available in Jest)
jest.mock('react-native-calendars', () => ({
  CalendarProvider: ({ children }) => children,
  ExpandableCalendar: jest.fn(() => null),
}));

// Mock react-native-gesture-handler (native module not available in Jest)
jest.mock('react-native-gesture-handler', () => ({
  GestureHandlerRootView: ({ children }) => children,
  Swipeable: jest.fn(),
  DrawerLayout: jest.fn(),
  State: {},
  PanGestureHandler: jest.fn(),
  TapGestureHandler: jest.fn(),
  FlingGestureHandler: jest.fn(),
  ForceTouchGestureHandler: jest.fn(),
  LongPressGestureHandler: jest.fn(),
  ScrollView: jest.fn(),
  Slider: jest.fn(),
  Switch: jest.fn(),
  TextInput: jest.fn(),
  ToolbarAndroid: jest.fn(),
  ViewPagerAndroid: jest.fn(),
  DrawerLayoutAndroid: jest.fn(),
  WebView: jest.fn(),
  NativeViewGestureHandler: jest.fn(),
  gestureHandlerRootHOC: jest.fn((component) => component),
  Directions: {},
}));
