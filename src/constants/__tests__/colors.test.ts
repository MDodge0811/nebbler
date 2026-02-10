import { colors } from '@constants/colors';

describe('colors', () => {
  it('should export a colors object with required theme properties', () => {
    expect(colors.background).toBe('#fff');
    expect(colors.text.primary).toBe('#333');
    expect(colors.text.secondary).toBe('#666');
    expect(colors.success).toBe('#4CAF50');
    expect(colors.error).toBe('#F44336');
  });

  it('should have all required color categories', () => {
    expect(colors).toHaveProperty('background');
    expect(colors).toHaveProperty('text');
    expect(colors).toHaveProperty('border');
    expect(colors).toHaveProperty('surface');
    expect(colors).toHaveProperty('success');
    expect(colors).toHaveProperty('error');
    expect(colors).toHaveProperty('warning');
    expect(colors).toHaveProperty('info');
    expect(colors).toHaveProperty('disabled');
  });
});
