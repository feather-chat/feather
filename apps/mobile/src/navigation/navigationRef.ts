import { createNavigationContainerRef } from '@react-navigation/native';
import type { MainStackParamList } from './types';

export const navigationRef = createNavigationContainerRef<MainStackParamList>();

let pendingNavigation: (() => void) | null = null;

export function navigateToChannel(workspaceId: string, channelId: string, channelName: string) {
  const navigate = () => navigationRef.navigate('Channel', { workspaceId, channelId, channelName });

  if (navigationRef.isReady()) {
    navigate();
  } else {
    pendingNavigation = navigate;
  }
}

export function navigateToThread(workspaceId: string, channelId: string, parentMessageId: string) {
  const navigate = () =>
    navigationRef.navigate('Thread', { workspaceId, channelId, parentMessageId });

  if (navigationRef.isReady()) {
    navigate();
  } else {
    pendingNavigation = navigate;
  }
}

/** Flush any pending navigation queued before the navigator was ready. */
export function flushPendingNavigation() {
  if (pendingNavigation && navigationRef.isReady()) {
    pendingNavigation();
    pendingNavigation = null;
  }
}
