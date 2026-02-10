import { PowerSyncConfigSchema } from '@database/schemas/configSchema';

describe('PowerSyncConfigSchema', () => {
  it('should validate a correct config with localhost URLs', () => {
    const result = PowerSyncConfigSchema.safeParse({
      powersyncUrl: 'http://localhost:8080',
      backendUrl: 'http://localhost:4000',
    });
    expect(result.success).toBe(true);
  });

  it('should validate a correct config with production URLs', () => {
    const result = PowerSyncConfigSchema.safeParse({
      powersyncUrl: 'https://my-instance.powersync.journeyapps.com',
      backendUrl: 'https://api.example.com',
    });
    expect(result.success).toBe(true);
  });

  it('should reject missing powersyncUrl', () => {
    const result = PowerSyncConfigSchema.safeParse({
      backendUrl: 'http://localhost:4000',
    });
    expect(result.success).toBe(false);
  });

  it('should reject missing backendUrl', () => {
    const result = PowerSyncConfigSchema.safeParse({
      powersyncUrl: 'http://localhost:8080',
    });
    expect(result.success).toBe(false);
  });

  it('should reject an invalid URL', () => {
    const result = PowerSyncConfigSchema.safeParse({
      powersyncUrl: 'not-a-url',
      backendUrl: 'http://localhost:4000',
    });
    expect(result.success).toBe(false);
  });

  it('should reject an empty string', () => {
    const result = PowerSyncConfigSchema.safeParse({
      powersyncUrl: '',
      backendUrl: 'http://localhost:4000',
    });
    expect(result.success).toBe(false);
  });
});
