/**
 * Thin wrapper around `expo-secure-store` for the rare cases where the
 * app needs to persist non-Clerk secrets.
 *
 * Auth tokens and session state are managed by `@clerk/clerk-expo`'s
 * built-in token cache (`@clerk/clerk-expo/token-cache`) — do NOT store
 * Clerk tokens here.
 */
import * as SecureStore from 'expo-secure-store';

export const secureStorage = {
  async get(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error('[SecureStorage] Failed to get:', key, error);
      return null;
    }
  },

  async set(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value);
  },

  async delete(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('[SecureStorage] Failed to delete:', key, error);
    }
  },
};
