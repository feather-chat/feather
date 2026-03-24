import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { requestPermissions, registerPushToken } from '../lib/notifications';

/** Manage push notification token lifecycle tied to authentication state. */
export function usePushNotifications(isAuthenticated: boolean): void {
  useEffect(() => {
    if (!isAuthenticated) return;

    (async () => {
      const granted = await requestPermissions();
      if (granted) {
        await registerPushToken();
      }
    })().catch((err) => {
      console.warn('Push notification setup failed:', err);
    });
  }, [isAuthenticated]);

  // Listen for token refreshes while authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    const subscription = Notifications.addPushTokenListener(() => {
      registerPushToken();
    });
    return () => subscription.remove();
  }, [isAuthenticated]);
}
