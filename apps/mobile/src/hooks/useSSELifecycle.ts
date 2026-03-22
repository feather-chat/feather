import { useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSSE } from './useSSE';
import { useAppState } from './useAppState';

export function useSSELifecycle(workspaceId: string | null): {
  isReconnecting: boolean;
} {
  const queryClient = useQueryClient();
  const [isActive, setIsActive] = useState(true);
  const workspaceIdRef = useRef(workspaceId);
  workspaceIdRef.current = workspaceId;

  // Pass undefined when backgrounded to disconnect SSE (triggers useSSE cleanup)
  const effectiveId = isActive ? (workspaceId ?? undefined) : undefined;
  const { isReconnecting } = useSSE(effectiveId);

  useAppState({
    onForeground: () => {
      setIsActive(true);
      // Invalidate all active queries to refetch stale data after resume
      if (workspaceIdRef.current) {
        queryClient.invalidateQueries();
      }
    },
    onBackground: () => {
      setIsActive(false);
    },
  });

  return { isReconnecting };
}
