import { View, Text, Pressable } from 'react-native';
import { formatTime } from '@enzyme/shared';
import type {
  MessageWithUser,
  WorkspaceMemberWithUser,
  ChannelWithMembership,
} from '@enzyme/api-client';
import { Avatar } from './Avatar';
import { MrkdwnRenderer } from './MrkdwnRenderer';
import { ReactionsDisplay } from './ReactionsDisplay';

interface MessageBubbleProps {
  message: MessageWithUser;
  workspaceId: string;
  channelId: string;
  members?: WorkspaceMemberWithUser[];
  channels?: ChannelWithMembership[];
  onAvatarPress?: (userId: string) => void;
  onThreadPress?: (messageId: string) => void;
  onLongPress?: (message: MessageWithUser) => void;
  onReactionPress?: (message: MessageWithUser) => void;
  currentUserId?: string;
}

export function MessageBubble({
  message,
  channelId,
  members,
  channels,
  onAvatarPress,
  onThreadPress,
  onLongPress,
  onReactionPress,
  currentUserId,
}: MessageBubbleProps) {
  // System messages
  if (message.type === 'system') {
    return (
      <View className="px-4 py-1">
        <Text className="text-center text-sm text-neutral-500 dark:text-neutral-400">
          {message.content}
        </Text>
      </View>
    );
  }

  const isEdited = !!message.edited_at;
  const isDeleted = !!message.deleted_at;

  return (
    <Pressable
      className="flex-row px-4 py-1.5 active:bg-neutral-50 dark:active:bg-neutral-800/50"
      onLongPress={() => onLongPress?.(message)}
      delayLongPress={300}
    >
      {/* Avatar */}
      <Pressable onPress={() => message.user_id && onAvatarPress?.(message.user_id)}>
        <Avatar
          user={{
            display_name: message.user_display_name ?? '',
            avatar_url: message.user_avatar_url,
            id: message.user_id,
          }}
          size="md"
        />
      </Pressable>

      {/* Content */}
      <View className="ml-2.5 flex-1">
        {/* Header: name + time */}
        <View className="flex-row items-baseline">
          <Pressable onPress={() => message.user_id && onAvatarPress?.(message.user_id)}>
            <Text className="text-sm font-bold text-neutral-900 dark:text-white">
              {message.user_display_name}
            </Text>
          </Pressable>
          <Text className="ml-2 text-xs text-neutral-500 dark:text-neutral-400">
            {formatTime(message.created_at)}
          </Text>
          {isEdited && (
            <Text className="ml-1 text-xs text-neutral-400 dark:text-neutral-500">(edited)</Text>
          )}
        </View>

        {/* Body */}
        {isDeleted ? (
          <Text className="mt-0.5 text-sm italic text-neutral-400 dark:text-neutral-500">
            This message was deleted.
          </Text>
        ) : (
          <View className="mt-0.5">
            <MrkdwnRenderer
              content={message.content}
              members={members}
              channels={channels}
              onMentionPress={onAvatarPress}
            />
          </View>
        )}

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <ReactionsDisplay
            reactions={message.reactions}
            messageId={message.id}
            channelId={channelId}
            currentUserId={currentUserId}
            onAddReaction={() => onReactionPress?.(message)}
          />
        )}

        {/* Thread reply count */}
        {message.reply_count > 0 && (
          <Pressable
            className="mt-1 flex-row items-center"
            onPress={() => onThreadPress?.(message.id)}
          >
            <Text className="text-sm font-semibold text-blue-500 dark:text-blue-400">
              {message.reply_count} {message.reply_count === 1 ? 'reply' : 'replies'}
            </Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}
