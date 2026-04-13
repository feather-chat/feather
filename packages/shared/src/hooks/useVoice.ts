import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, throwIfError } from '@enzyme/api-client';
import type { VoiceParticipant } from '@enzyme/api-client';
import { voiceKeys } from '../queryKeys';

export function useVoiceParticipants(channelId: string | undefined) {
  return useQuery({
    queryKey: voiceKeys.participants(channelId!),
    queryFn: async (): Promise<VoiceParticipant[]> => {
      const result = await throwIfError(
        apiClient.GET('/channels/{id}/voice/participants', {
          params: { path: { id: channelId! } },
        }),
      );
      return result.participants;
    },
    enabled: !!channelId,
    staleTime: 10000,
  });
}

export function useJoinVoice() {
  return useMutation({
    mutationFn: async (channelId: string) => {
      return throwIfError(
        apiClient.POST('/channels/{id}/voice/join', {
          params: { path: { id: channelId } },
        }),
      );
    },
  });
}

export function useLeaveVoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (channelId: string) => {
      return throwIfError(
        apiClient.POST('/channels/{id}/voice/leave', {
          params: { path: { id: channelId } },
        }),
      );
    },
    onSuccess: (_, channelId) => {
      queryClient.invalidateQueries({ queryKey: voiceKeys.participants(channelId) });
    },
  });
}

export function useVoiceAnswer() {
  return useMutation({
    mutationFn: async ({
      channelId,
      answer,
    }: {
      channelId: string;
      answer: { sdp: string; type: string };
    }) => {
      return throwIfError(
        apiClient.POST('/channels/{id}/voice/answer', {
          params: { path: { id: channelId } },
          body: { answer: answer as { sdp: string; type: 'offer' | 'answer' } },
        }),
      );
    },
  });
}

export function useVoiceICECandidate() {
  return useMutation({
    mutationFn: async ({
      channelId,
      candidate,
      sdpMid,
      sdpMlineIndex,
    }: {
      channelId: string;
      candidate: string;
      sdpMid?: string;
      sdpMlineIndex?: number;
    }) => {
      return throwIfError(
        apiClient.POST('/channels/{id}/voice/ice-candidate', {
          params: { path: { id: channelId } },
          body: { candidate, sdp_mid: sdpMid, sdp_mline_index: sdpMlineIndex },
        }),
      );
    },
  });
}

export function useMuteVoice() {
  return useMutation({
    mutationFn: async ({ channelId, muted }: { channelId: string; muted: boolean }) => {
      return throwIfError(
        apiClient.POST('/channels/{id}/voice/mute', {
          params: { path: { id: channelId } },
          body: { muted },
        }),
      );
    },
  });
}

export function useDeafenVoice() {
  return useMutation({
    mutationFn: async ({ channelId, deafened }: { channelId: string; deafened: boolean }) => {
      return throwIfError(
        apiClient.POST('/channels/{id}/voice/deafen', {
          params: { path: { id: channelId } },
          body: { deafened },
        }),
      );
    },
  });
}

export function useServerMuteVoice() {
  return useMutation({
    mutationFn: async ({
      channelId,
      userId,
      muted,
    }: {
      channelId: string;
      userId: string;
      muted: boolean;
    }) => {
      return throwIfError(
        apiClient.POST('/channels/{id}/voice/server-mute', {
          params: { path: { id: channelId } },
          body: { user_id: userId, muted },
        }),
      );
    },
  });
}
