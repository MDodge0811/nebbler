import { z } from 'zod';

/**
 * Custom URL validator that supports localhost URLs.
 * Uses the native URL constructor instead of z.string().url()
 * which can be too strict for development URLs.
 */
const urlString = z.string().refine(
  (val) => {
    try {
      new URL(val);
      return true;
    } catch {
      return false;
    }
  },
  { message: 'Must be a valid URL' }
);

/**
 * Schema for PowerSync configuration.
 * Validates powersyncUrl and backendUrl at runtime.
 */
export const PowerSyncConfigSchema = z.object({
  powersyncUrl: urlString,
  backendUrl: urlString,
});

export type PowerSyncConfig = z.infer<typeof PowerSyncConfigSchema>;
