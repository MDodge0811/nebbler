import type { Theme } from '@react-navigation/native';
import type { SyncState } from '@hooks/useSyncStatus';

/**
 * Navigation theme matching the Gluestack/Tailwind design tokens (light mode).
 * Colors are derived from the CSS variable values in components/ui/gluestack-ui-provider/config.ts.
 */
export const navigationTheme: Theme = {
  dark: false,
  fonts: {
    regular: { fontFamily: 'System', fontWeight: '400' },
    medium: { fontFamily: 'System', fontWeight: '500' },
    bold: { fontFamily: 'System', fontWeight: '700' },
    heavy: { fontFamily: 'System', fontWeight: '800' },
  },
  colors: {
    background: '#FFFFFF',
    card: '#FFFFFF',
    text: '#262627',
    border: '#DDDCDB',
    primary: '#333333',
    notification: '#EF4444',
  },
};

/**
 * Hex colors for the SyncStatusIndicator animated dot.
 * Animated.View requires style-based colors (not Tailwind classes).
 * Values derived from the Tailwind theme CSS variables.
 */
export const syncDotColors: Record<SyncState, string> = {
  connecting: '#FBA94B',
  connected: '#489766',
  syncing: '#0DA6F2',
  synced: '#489766',
  offline: '#A3A3A3',
  error: '#EF4444',
};
