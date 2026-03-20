import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { emojisApi, type CustomEmoji } from '@enzyme/api-client';
import { emojiKeys } from '../queryKeys';

export function useCustomEmojis(workspaceId: string | undefined) {
  return useQuery({
    queryKey: emojiKeys.list(workspaceId!),
    queryFn: () => emojisApi.list(workspaceId!),
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000,
    select: (data) => data.emojis,
  });
}

export function useCustomEmojiMap(workspaceId: string | undefined) {
  const { data: emojis } = useCustomEmojis(workspaceId);
  return useMemo(() => {
    const map = new Map<string, CustomEmoji>();
    if (emojis) {
      for (const emoji of emojis) {
        map.set(emoji.name, emoji);
      }
    }
    return map;
  }, [emojis]);
}

export function useUploadCustomEmoji(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, name }: { file: File; name: string }) =>
      emojisApi.upload(workspaceId, file, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: emojiKeys.list(workspaceId) });
    },
  });
}

export function useDeleteCustomEmoji(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (emojiId: string) => emojisApi.delete(emojiId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: emojiKeys.list(workspaceId) });
    },
  });
}
