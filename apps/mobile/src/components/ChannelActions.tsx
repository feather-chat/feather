import { useCallback } from 'react';
import { View, Text, Pressable, Modal, Alert } from 'react-native';
import {
  useStarChannel,
  useUnstarChannel,
  useMarkChannelAsRead,
  useLeaveChannel,
  useChannelNotifications,
  useUpdateChannelNotifications,
} from '@enzyme/shared';
import type { ChannelWithMembership } from '@enzyme/api-client';

interface ChannelActionsProps {
  channel: ChannelWithMembership | null;
  workspaceId: string;
  onDismiss: () => void;
  onLeave?: () => void;
}

export function ChannelActions({ channel, workspaceId, onDismiss, onLeave }: ChannelActionsProps) {
  const starChannel = useStarChannel(workspaceId);
  const unstarChannel = useUnstarChannel(workspaceId);
  const markAsRead = useMarkChannelAsRead(workspaceId);
  const leaveChannel = useLeaveChannel(workspaceId);
  const { data: notifData } = useChannelNotifications(channel?.id);
  const updateNotifications = useUpdateChannelNotifications(channel?.id ?? '');

  const isDM = channel?.type === 'dm' || channel?.type === 'group_dm';
  const isMuted = notifData?.preferences?.notify_level === 'none';

  const handleStar = useCallback(() => {
    if (!channel) return;
    if (channel.is_starred) {
      unstarChannel.mutate(channel.id);
    } else {
      starChannel.mutate(channel.id);
    }
    onDismiss();
  }, [channel, starChannel, unstarChannel, onDismiss]);

  const handleMute = useCallback(() => {
    if (!channel) return;
    const currentEmailEnabled = notifData?.preferences?.email_enabled ?? true;
    updateNotifications.mutate({
      notify_level: isMuted ? 'all' : 'none',
      email_enabled: currentEmailEnabled,
    });
    onDismiss();
  }, [channel, isMuted, updateNotifications, onDismiss]);

  const handleMarkAsRead = useCallback(() => {
    if (!channel) return;
    markAsRead.mutate({ channelId: channel.id });
    onDismiss();
  }, [channel, workspaceId, markAsRead, onDismiss]);

  const handleLeave = useCallback(() => {
    if (!channel) return;
    Alert.alert('Leave channel', `Are you sure you want to leave #${channel.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: () => {
          leaveChannel.mutate(channel.id);
          onDismiss();
          onLeave?.();
        },
      },
    ]);
  }, [channel, leaveChannel, onDismiss, onLeave]);

  return (
    <Modal visible={!!channel} animationType="fade" transparent onRequestClose={onDismiss}>
      <Pressable className="flex-1 justify-end bg-black/40" onPress={onDismiss}>
        <Pressable className="rounded-t-2xl bg-white pb-8 dark:bg-neutral-800">
          <View className="items-center py-2">
            <View className="h-1 w-10 rounded-full bg-neutral-300 dark:bg-neutral-600" />
          </View>

          <ActionButton label={channel?.is_starred ? 'Unstar' : 'Star'} onPress={handleStar} />
          {!isDM && <ActionButton label={isMuted ? 'Unmute' : 'Mute'} onPress={handleMute} />}
          {channel && channel.unread_count > 0 && (
            <ActionButton label="Mark as read" onPress={handleMarkAsRead} />
          )}
          {channel && !channel.is_default && !isDM && (
            <ActionButton label="Leave channel" onPress={handleLeave} destructive />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function ActionButton({
  label,
  onPress,
  destructive = false,
}: {
  label: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  return (
    <Pressable
      className="px-6 py-3.5 active:bg-neutral-100 dark:active:bg-neutral-700"
      onPress={onPress}
    >
      <Text
        className={`text-base ${
          destructive ? 'font-semibold text-red-500' : 'text-neutral-900 dark:text-white'
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
