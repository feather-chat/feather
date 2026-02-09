import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ThreadListResult } from '@feather/api-client';
import { messagesApi } from '../api/messages';

interface UseUserThreadsOptions {
  workspaceId: string;
  enabled?: boolean;
}

export function useUserThreads({ workspaceId, enabled = true }: UseUserThreadsOptions) {
  return useInfiniteQuery<ThreadListResult>({
    queryKey: ['user-threads', workspaceId],
    queryFn: async ({ pageParam }) => {
      return messagesApi.listUserThreads(workspaceId, {
        limit: 20,
        cursor: pageParam as string | undefined,
      });
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor,
    enabled: enabled && !!workspaceId,
    staleTime: 30000,
    refetchInterval: 60000,
  });
}

export function useMarkThreadRead(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ messageId, lastReadReplyId }: { messageId: string; lastReadReplyId?: string }) =>
      messagesApi.markThreadRead(messageId, lastReadReplyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-threads', workspaceId] });
    },
  });
}
