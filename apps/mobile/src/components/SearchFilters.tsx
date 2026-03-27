import { useCallback } from 'react';
import { View, Text, Pressable, Modal, FlatList } from 'react-native';
import { useChannels, useWorkspaceMembers } from '@enzyme/shared';
import type { ChannelWithMembership, WorkspaceMemberWithUser } from '@enzyme/api-client';
import { Avatar } from './ui/Avatar';

interface SearchFiltersProps {
  visible: boolean;
  workspaceId: string;
  selectedChannelId: string | undefined;
  selectedUserId: string | undefined;
  onSelectChannel: (channelId: string | undefined) => void;
  onSelectUser: (userId: string | undefined) => void;
  onDismiss: () => void;
}

export function SearchFilters({
  visible,
  workspaceId,
  selectedChannelId,
  selectedUserId,
  onSelectChannel,
  onSelectUser,
  onDismiss,
}: SearchFiltersProps) {
  const { data: channelsData } = useChannels(workspaceId);
  const { data: membersData } = useWorkspaceMembers(workspaceId);

  const channels = channelsData?.channels?.filter((c) => !c.archived_at) ?? [];
  const members = membersData?.members ?? [];

  const handleClear = useCallback(() => {
    onSelectChannel(undefined);
    onSelectUser(undefined);
  }, [onSelectChannel, onSelectUser]);

  const renderChannel = useCallback(
    ({ item }: { item: ChannelWithMembership }) => {
      const isSelected = item.id === selectedChannelId;
      return (
        <Pressable
          className={`flex-row items-center px-4 py-2.5 ${isSelected ? 'bg-blue-50 dark:bg-blue-900/30' : 'active:bg-neutral-100 dark:active:bg-neutral-800'}`}
          onPress={() => onSelectChannel(isSelected ? undefined : item.id)}
        >
          <Text className="w-8 text-center text-base">{item.type === 'private' ? '🔒' : '#'}</Text>
          <Text className="ml-1 flex-1 text-base text-neutral-900 dark:text-white">
            {item.name}
          </Text>
          {isSelected && <Text className="text-blue-500">✓</Text>}
        </Pressable>
      );
    },
    [selectedChannelId, onSelectChannel],
  );

  const renderMember = useCallback(
    ({ item }: { item: WorkspaceMemberWithUser }) => {
      const isSelected = item.user_id === selectedUserId;
      return (
        <Pressable
          className={`flex-row items-center px-4 py-2.5 ${isSelected ? 'bg-blue-50 dark:bg-blue-900/30' : 'active:bg-neutral-100 dark:active:bg-neutral-800'}`}
          onPress={() => onSelectUser(isSelected ? undefined : item.user_id)}
        >
          <Avatar
            user={{
              display_name: item.display_name,
              avatar_url: item.avatar_url,
              gravatar_url: item.gravatar_url,
              id: item.user_id,
            }}
            size="sm"
          />
          <Text className="ml-2 flex-1 text-base text-neutral-900 dark:text-white">
            {item.display_name}
          </Text>
          {isSelected && <Text className="text-blue-500">✓</Text>}
        </Pressable>
      );
    },
    [selectedUserId, onSelectUser],
  );

  const hasFilters = !!selectedChannelId || !!selectedUserId;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onDismiss}>
      <Pressable className="flex-1 justify-end bg-black/40" onPress={onDismiss}>
        <Pressable className="max-h-[70%] rounded-t-2xl bg-white pb-8 dark:bg-neutral-800">
          <View className="items-center py-2">
            <View className="h-1 w-10 rounded-full bg-neutral-300 dark:bg-neutral-600" />
          </View>

          <View className="flex-row items-center justify-between px-4 pb-2">
            <Text className="text-lg font-bold text-neutral-900 dark:text-white">Filters</Text>
            {hasFilters && (
              <Pressable onPress={handleClear}>
                <Text className="text-sm text-blue-500">Clear all</Text>
              </Pressable>
            )}
          </View>

          {/* Channel filter */}
          <View className="px-4 pb-1 pt-2">
            <Text className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              Channel
            </Text>
          </View>
          <FlatList
            data={channels.filter((c) => c.type !== 'dm' && c.type !== 'group_dm')}
            keyExtractor={(item) => item.id}
            renderItem={renderChannel}
            style={{ maxHeight: 150 }}
          />

          {/* User filter */}
          <View className="px-4 pb-1 pt-3">
            <Text className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              From
            </Text>
          </View>
          <FlatList
            data={members}
            keyExtractor={(item) => item.user_id}
            renderItem={renderMember}
            style={{ maxHeight: 150 }}
          />

          <View className="px-4 pt-4">
            <Pressable
              className="items-center rounded-lg bg-blue-500 py-3 active:bg-blue-600"
              onPress={onDismiss}
            >
              <Text className="text-base font-semibold text-white">Apply</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
