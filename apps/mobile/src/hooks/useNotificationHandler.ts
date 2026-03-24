import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { navigateToChannel, navigateToThread } from '../navigation/navigationRef';
import { useAppState } from './useAppState';

const SUPPRESS = {
  shouldPlaySound: false,
  shouldSetBadge: false,
  shouldShowBanner: false,
  shouldShowList: false,
} as const;

/** Configure foreground notification behavior, handle taps, and manage badge. */
export function useNotificationHandler(isAuthenticated: boolean): void {
  const hasHandledColdStart = useRef(false);

  // Suppress all notifications while the app is foregrounded.
  // The SSE connection delivers real-time updates already — showing a
  // system notification on top would be redundant and noisy (matches
  // Slack and Discord behavior).
  useEffect(() => {
    if (!isAuthenticated) return;

    Notifications.setNotificationHandler({
      handleNotification: async () => SUPPRESS,
    });

    return () => {
      Notifications.setNotificationHandler(null);
    };
  }, [isAuthenticated]);

  // Handle notification taps (warm start)
  useEffect(() => {
    if (!isAuthenticated) return;

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      handleNotificationTap(response.notification.request.content.data);
    });

    return () => subscription.remove();
  }, [isAuthenticated]);

  // Handle cold start — check if app was launched from a notification
  useEffect(() => {
    if (!isAuthenticated || hasHandledColdStart.current) return;
    hasHandledColdStart.current = true;

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        handleNotificationTap(response.notification.request.content.data);
      }
    });
  }, [isAuthenticated]);

  // Clear badge on foreground
  useAppState({
    onForeground: async () => {
      const count = await Notifications.getBadgeCountAsync();
      if (count > 0) {
        await Notifications.setBadgeCountAsync(0);
      }
    },
  });
}

function handleNotificationTap(data: Record<string, unknown> | undefined) {
  if (!data) return;

  const workspaceId = typeof data.workspace_id === 'string' ? data.workspace_id : undefined;
  const channelId = typeof data.channel_id === 'string' ? data.channel_id : undefined;
  const channelName = typeof data.channel_name === 'string' ? data.channel_name : '';
  const threadParentId =
    typeof data.thread_parent_id === 'string' ? data.thread_parent_id : undefined;

  if (!workspaceId || !channelId) return;

  if (threadParentId) {
    navigateToThread(workspaceId, channelId, threadParentId);
  } else {
    navigateToChannel(workspaceId, channelId, channelName);
  }
}
