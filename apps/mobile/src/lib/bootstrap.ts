import * as SecureStore from 'expo-secure-store';
import { setAuthToken, setTokenStorage, setApiBase } from '@enzyme/api-client';
import { getServerUrl } from './serverStorage';

const TOKEN_KEY = 'enzyme_auth_token';

// In-memory cache for sync access
let cachedToken: string | null = null;
let initialized = false;

/**
 * Bootstrap the app on startup. Loads the saved server URL and auth token
 * from secure storage (async), then configures the api-client with sync
 * in-memory accessors.
 */
export async function bootstrap(): Promise<void> {
  if (initialized) return;

  // 1. Restore server URL
  const savedUrl = await getServerUrl();
  if (savedUrl) {
    setApiBase(savedUrl);
  }

  // 2. Restore auth token into memory
  cachedToken = await SecureStore.getItemAsync(TOKEN_KEY);
  if (cachedToken) {
    setAuthToken(cachedToken);
  }

  // 3. Register sync token storage backed by in-memory cache + async persist
  setTokenStorage({
    get: () => cachedToken,
    set: (token: string) => {
      cachedToken = token;
      SecureStore.setItemAsync(TOKEN_KEY, token).catch((err) =>
        console.warn('Failed to persist auth token:', err),
      );
    },
    remove: () => {
      cachedToken = null;
      SecureStore.deleteItemAsync(TOKEN_KEY).catch((err) =>
        console.warn('Failed to remove auth token:', err),
      );
    },
  });

  initialized = true;
}
