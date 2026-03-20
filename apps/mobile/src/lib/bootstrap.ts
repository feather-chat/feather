import * as SecureStore from 'expo-secure-store';
import { setAuthToken, setTokenStorage, setApiBase } from '@enzyme/api-client';

const TOKEN_KEY = 'enzyme_auth_token';
const SERVER_URL_KEY = 'enzyme_server_url';

// In-memory cache for sync access
let cachedToken: string | null = null;

/**
 * Bootstrap the app on startup. Loads the saved server URL and auth token
 * from secure storage (async), then configures the api-client with sync
 * in-memory accessors.
 */
export async function bootstrap(): Promise<void> {
  // 1. Restore server URL
  const savedUrl = await SecureStore.getItemAsync(SERVER_URL_KEY);
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
      SecureStore.setItemAsync(TOKEN_KEY, token);
    },
    remove: () => {
      cachedToken = null;
      SecureStore.deleteItemAsync(TOKEN_KEY);
    },
  });
}
