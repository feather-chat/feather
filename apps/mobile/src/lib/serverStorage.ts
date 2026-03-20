import * as SecureStore from 'expo-secure-store';
import { setApiBase } from '@enzyme/api-client';

const SERVER_URL_KEY = 'enzyme_server_url';

/**
 * Save the server URL and reconfigure the API client.
 */
export async function saveServerUrl(url: string): Promise<void> {
  await SecureStore.setItemAsync(SERVER_URL_KEY, url);
  setApiBase(url);
}

/**
 * Get the saved server URL, if any.
 */
export async function getServerUrl(): Promise<string | null> {
  return SecureStore.getItemAsync(SERVER_URL_KEY);
}
