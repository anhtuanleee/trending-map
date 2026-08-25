import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

function getWebStorage() {
  return typeof globalThis.localStorage === 'undefined' ? null : globalThis.localStorage;
}

export const platformStorage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return getWebStorage()?.getItem(key) ?? null;
    }

    return SecureStore.getItemAsync(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      getWebStorage()?.setItem(key, value);
      return;
    }

    await SecureStore.setItemAsync(key, value);
  },

  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      getWebStorage()?.removeItem(key);
      return;
    }

    await SecureStore.deleteItemAsync(key);
  },
};
