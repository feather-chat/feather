import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, FlatList, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useMessages,
  useMarkChannelAsRead,
  useWorkspaceMembers,
  useChannels,
  useAuth,
} from '@enzyme/shared';
import type { MessageWithUser } from '@enzyme/api-client';
import type { MainScreenProps } from '../navigation/types';
import { MessageBubble } from '../components/MessageBubble';
import { DateSeparator } from '../components/DateSeparator';
import { MessageComposer } from '../components/MessageComposer';
import { MessageActions } from '../components/MessageActions';
import { TypingIndicator } from '../components/TypingIndicator';
import { buildListItems, type ListItem } from '../lib/buildListItems';

export function ChannelScreen({ route, navigation }: MainScreenProps<'Channel'>) {
  const { workspaceId, channelId } = route.params;
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useMessages(channelId);
  const markAsRead = useMarkChannelAsRead(workspaceId);
  const { data: membersData } = useWorkspaceMembers(workspaceId);
  const { data: channelsData } = useChannels(workspaceId);
  const members = membersData?.members;
  const channels = channelsData?.channels;

  const [actionMessage, setActionMessage] = useState<MessageWithUser | null>(null);
  const [reactionMessage, setReactionMessage] = useState<MessageWithUser | null>(null);

  // Mark as read on mount and when new messages arrive
  const latestMessageId = data?.pages[0]?.messages[0]?.id;
  useEffect(() => {
    if (latestMessageId) {
      markAsRead.mutate({ channelId, messageId: latestMessageId });
    }
  }, [latestMessageId, channelId]);

  // Build list items with date separators (inverted, so newest first)
  const listItems = useMemo<ListItem[]>(() => buildListItems(data?.pages), [data?.pages]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderItem = useCallback(
    ({ item }: { item: ListItem }) => {
      if (item.type === 'date') {
        return <DateSeparator date={item.date} />;
      }

      return (
        <MessageBubble
          message={item.data}
          workspaceId={workspaceId}
          channelId={channelId}
          members={members}
          channels={channels}
          currentUserId={user?.id}
          isGrouped={item.isGrouped}
          onAvatarPress={(userId) => navigation.navigate('Profile', { workspaceId, userId })}
          onThreadPress={(messageId) =>
            navigation.navigate('Thread', {
              workspaceId,
              channelId,
              parentMessageId: messageId,
            })
          }
          onLongPress={setActionMessage}
          onReactionPress={setReactionMessage}
        />
      );
    },
    [workspaceId, channelId, members, channels, user?.id, navigation],
  );

  const keyExtractor = useCallback(
    (item: ListItem) => (item.type === 'message' ? item.data.id : item.id),
    [],
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
      <FlatList
        data={listItems}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
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

      <TypingIndicator channelId={channelId} />

      <MessageComposer
        channelId={channelId}
        workspaceId={workspaceId}
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
