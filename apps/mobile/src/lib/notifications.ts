import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { authApi, getAuthToken } from '@enzyme/api-client';

const DEVICE_ID_KEY = 'enzyme_device_id';
const TOKEN_ID_KEY = 'enzyme_registered_token_id';

async function getDeviceId(): Promise<string> {
  const existing = await SecureStore.getItemAsync(DEVICE_ID_KEY);
  if (existing) return existing;

  const id = crypto.randomUUID();
  await SecureStore.setItemAsync(DEVICE_ID_KEY, id);
  return id;
}

/** Request notification permissions. Returns true if granted. */
export async function requestPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: true, allowSound: true },
  });
  return status === 'granted';
}

/** Get the native push token (FCM or APNs). Returns null on simulator. */
export async function getDevicePushToken(): Promise<string | null> {
  if (!Device.isDevice) return null;

  try {
    const token = await Notifications.getDevicePushTokenAsync();
    if (typeof token.data !== 'string') return null;
    return token.data;
  } catch {
    return null;
  }
}

/** Register device token with the Enzyme backend. Idempotent (backend upserts). */
export async function registerPushToken(): Promise<void> {
  try {
    if (!getAuthToken()) return;

    const [token, deviceId] = await Promise.all([getDevicePushToken(), getDeviceId()]);
    if (!token) return;

    const platform = Platform.OS === 'ios' ? 'apns' : 'fcm';

    const response = await authApi.registerDeviceToken({
      token,
      platform,
      device_id: deviceId,
    });
    // Persist to SecureStore first — in-memory is lost on process kill anyway
    await SecureStore.setItemAsync(TOKEN_ID_KEY, response.id);
  } catch (err) {
    console.warn('Push token registration failed:', err);
  }
}

/** Unregister the current device token from the backend. Call on logout. */
export async function unregisterPushToken(): Promise<void> {
  const tokenId = await SecureStore.getItemAsync(TOKEN_ID_KEY);
  if (!tokenId) return;

  try {
    await authApi.unregisterDeviceToken(tokenId);
  } catch (err) {
    console.warn('Push token unregistration failed:', err);
  } finally {
    await SecureStore.deleteItemAsync(TOKEN_ID_KEY);
  }
}
