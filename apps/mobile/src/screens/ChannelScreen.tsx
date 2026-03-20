import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, FlatList, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
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

type ListItem =
  | { type: 'message'; data: MessageWithUser }
  | { type: 'date'; date: string; id: string };

export function ChannelScreen({ route, navigation }: MainScreenProps<'Channel'>) {
  const { workspaceId, channelId } = route.params;
  const { user } = useAuth();
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
  const listItems = useMemo<ListItem[]>(() => {
    if (!data?.pages) return [];

    const messages = data.pages.flatMap((p) => p.messages);
    const items: ListItem[] = [];

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const msgDate = msg.created_at.split('T')[0];
      const prevDate = messages[i + 1]?.created_at.split('T')[0];

      items.push({ type: 'message', data: msg });

      // Insert date separator when the date changes (going back in time since inverted)
      if (prevDate && msgDate !== prevDate) {
        items.push({ type: 'date', date: msg.created_at, id: `date-${msgDate}` });
      }
      // Also show date separator for the oldest message in the batch
      if (i === messages.length - 1) {
        items.push({ type: 'date', date: msg.created_at, id: `date-${msgDate}-last` });
      }
    }

    return items;
  }, [data?.pages]);

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
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        data={listItems}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        inverted
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isFetchingNextPage ? <ActivityIndicator style={{ padding: 16 }} /> : null
        }
        contentContainerStyle={{ paddingVertical: 8 }}
      />

      <TypingIndicator channelId={channelId} />

      <MessageComposer channelId={channelId} workspaceId={workspaceId} />

      <MessageActions
        message={actionMessage}
        reactionMessage={reactionMessage}
        onDismiss={() => {
          setActionMessage(null);
          setReactionMessage(null);
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
