import { useCallback, useMemo, useState } from 'react';
import {
  View,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Switch,
  Text,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useMessage,
  useThreadMessages,
  useWorkspaceMembers,
  useChannels,
  useAuth,
} from '@enzyme/shared';
import type { MessageWithUser } from '@enzyme/api-client';
import type { MainScreenProps } from '../navigation/types';
import { MessageBubble } from '../components/MessageBubble';
import { MessageComposer } from '../components/MessageComposer';
import { MessageActions } from '../components/MessageActions';

const GROUP_THRESHOLD_MS = 5 * 60 * 1000;

export function ThreadScreen({ route, navigation }: MainScreenProps<'Thread'>) {
  const { workspaceId, channelId, parentMessageId } = route.params;
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { data: parentData } = useMessage(parentMessageId);
  const parentMessage = parentData?.message;
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useThreadMessages(parentMessageId);
  const { data: membersData } = useWorkspaceMembers(workspaceId);
  const { data: channelsData } = useChannels(workspaceId);
  const members = membersData?.members;
  const channels = channelsData?.channels;

  const [actionMessage, setActionMessage] = useState<MessageWithUser | null>(null);
  const [reactionMessage, setReactionMessage] = useState<MessageWithUser | null>(null);
  const [alsoSendToChannel, setAlsoSendToChannel] = useState(false);

  const replies = useMemo(
    () => (data?.pages.flatMap((p) => p.messages) ?? []).slice().reverse(),
    [data?.pages],
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderItem = useCallback(
    ({ item, index }: { item: MessageWithUser; index: number }) => {
      const next = replies[index + 1];
      const isGrouped =
        !!next &&
        item.type !== 'system' &&
        next.type !== 'system' &&
        item.user_id === next.user_id &&
        !next.deleted_at &&
        Math.abs(new Date(item.created_at).getTime() - new Date(next.created_at).getTime()) <
          GROUP_THRESHOLD_MS;

      return (
        <MessageBubble
          message={item}
          workspaceId={workspaceId}
          channelId={channelId}
          members={members}
          channels={channels}
          currentUserId={user?.id}
          isGrouped={isGrouped}
          onAvatarPress={(userId) => navigation.navigate('Profile', { workspaceId, userId })}
          onLongPress={setActionMessage}
          onReactionPress={setReactionMessage}
        />
      );
    },
    [workspaceId, channelId, members, channels, user?.id, navigation, replies],
  );

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-neutral-900">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white dark:bg-neutral-900"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 44 : 0}
    >
      {/* Parent message */}
      {parentMessage && (
        <View className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800/50">
          <MessageBubble
            message={parentMessage}
            workspaceId={workspaceId}
            channelId={channelId}
            members={members}
            channels={channels}
            currentUserId={user?.id}
            onAvatarPress={(userId) => navigation.navigate('Profile', { workspaceId, userId })}
          />
        </View>
      )}

      {/* Replies */}
      <FlatList
        data={replies}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        inverted
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        ListFooterComponent={
          isFetchingNextPage ? <ActivityIndicator style={{ padding: 16 }} /> : null
        }
        contentContainerStyle={{ paddingVertical: 8 }}
      />

      {/* Also send to channel toggle */}
      <View className="flex-row items-center justify-between border-t border-neutral-200 px-4 py-2 dark:border-neutral-700">
        <Text className="text-sm text-neutral-600 dark:text-neutral-400">Also send to channel</Text>
        <Switch
          value={alsoSendToChannel}
          onValueChange={setAlsoSendToChannel}
          trackColor={{ true: '#3b82f6' }}
        />
      </View>

      <MessageComposer
        channelId={channelId}
        workspaceId={workspaceId}
        threadParentId={parentMessageId}
        alsoSendToChannel={alsoSendToChannel}
        bottomInset={insets.bottom}
      />

      <MessageActions
        message={actionMessage}
        reactionMessage={reactionMessage}
        onDismiss={() => {
          setActionMessage(null);
          setReactionMessage(null);
        }}
        onShowReactionPicker={(msg) => {
          setActionMessage(null);
          setReactionMessage(msg);
        }}
        onReply={(messageId) =>
          navigation.navigate('Thread', {
            workspaceId,
            channelId,
            parentMessageId: messageId,
          })
        }
        channelId={channelId}
        currentUserId={user?.id}
      />
    </KeyboardAvoidingView>
  );
}
