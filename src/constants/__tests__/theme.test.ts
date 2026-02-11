import { navigationTheme, syncDotColors } from '@constants/theme';

describe('navigationTheme', () => {
  it('should have all required React Navigation theme colors', () => {
    expect(navigationTheme.colors.background).toBeDefined();
    expect(navigationTheme.colors.text).toBeDefined();
    expect(navigationTheme.colors.primary).toBeDefined();
    expect(navigationTheme.colors.card).toBeDefined();
    expect(navigationTheme.colors.border).toBeDefined();
    expect(navigationTheme.colors.notification).toBeDefined();
  });

  it('should be a light theme', () => {
    expect(navigationTheme.dark).toBe(false);
  });
});

describe('syncDotColors', () => {
  it('should have colors for all sync states', () => {
    expect(syncDotColors).toHaveProperty('connecting');
    expect(syncDotColors).toHaveProperty('connected');
    expect(syncDotColors).toHaveProperty('syncing');
    expect(syncDotColors).toHaveProperty('synced');
    expect(syncDotColors).toHaveProperty('offline');
    expect(syncDotColors).toHaveProperty('error');
  });

  it('should have valid hex color values', () => {
    const hexPattern = /^#[0-9A-Fa-f]{6}$/;
    Object.values(syncDotColors).forEach((color) => {
      expect(color).toMatch(hexPattern);
    });
  });
});
