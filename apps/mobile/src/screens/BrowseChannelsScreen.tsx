import { useCallback, useMemo, useState } from 'react';
import { View, Text, TextInput, FlatList, Pressable, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useChannels, useJoinChannel } from '@enzyme/shared';
import type { ChannelWithMembership } from '@enzyme/api-client';
import type { MainScreenProps } from '../navigation/types';

export function BrowseChannelsScreen({ route, navigation }: MainScreenProps<'BrowseChannels'>) {
  const { workspaceId } = route.params;
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { data: channelsData } = useChannels(workspaceId);
  const joinChannel = useJoinChannel(workspaceId);
  const [filter, setFilter] = useState('');

  const unjoinedChannels = useMemo(() => {
    if (!channelsData?.channels) return [];
    return channelsData.channels.filter(
      (c) => c.type === 'public' && c.channel_role === undefined && !c.archived_at,
    );
  }, [channelsData]);

  const filteredChannels = useMemo(() => {
    if (!filter.trim()) return unjoinedChannels;
    const q = filter.toLowerCase();
    return unjoinedChannels.filter((c) => c.name.toLowerCase().includes(q));
  }, [unjoinedChannels, filter]);

  const handleJoin = useCallback(
    (channel: ChannelWithMembership) => {
      joinChannel.mutate(channel.id, {
        onSuccess: () => {
          navigation.replace('Channel', {
            workspaceId,
            channelId: channel.id,
            channelName: channel.name,
          });
        },
      });
    },
    [joinChannel, navigation, workspaceId],
  );

  const renderChannel = useCallback(
    ({ item }: { item: ChannelWithMembership }) => (
      <View className="flex-row items-center border-b border-neutral-100 px-4 py-3 dark:border-neutral-800">
        <View className="flex-1">
          <View className="flex-row items-center">
            <Text className="text-base font-medium text-neutral-900 dark:text-white">
              # {item.name}
            </Text>
          </View>
          {item.description ? (
            <Text
              className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400"
              numberOfLines={1}
            >
              {item.description}
            </Text>
          ) : null}
        </View>
        <Pressable
          className="rounded-lg bg-blue-500 px-4 py-1.5 active:bg-blue-600"
          onPress={() => handleJoin(item)}
        >
          <Text className="text-sm font-medium text-white">Join</Text>
        </Pressable>
      </View>
    ),
    [handleJoin],
  );

  return (
    <View className="flex-1 bg-white dark:bg-neutral-900">
      {/* Search filter */}
      <View className="flex-row items-center border-b border-neutral-200 px-4 py-2 dark:border-neutral-700">
        <Ionicons name="search-outline" size={20} color={isDark ? '#a3a3a3' : '#737373'} />
        <TextInput
          className="ml-2 flex-1 text-base text-neutral-900 dark:text-white"
          placeholder="Filter channels..."
          placeholderTextColor={isDark ? '#737373' : '#a3a3a3'}
          value={filter}
          onChangeText={setFilter}
          autoCapitalize="none"
        />
      </View>

      <FlatList
        data={filteredChannels}
        keyExtractor={(item) => item.id}
        renderItem={renderChannel}
        ListEmptyComponent={
          <View className="items-center px-8 pt-20">
            <Text className="text-center text-base text-neutral-500 dark:text-neutral-400">
              {unjoinedChannels.length === 0
                ? "You've joined all available channels"
                : 'No channels match your filter'}
            </Text>
          </View>
        }
      />
    </View>
  );
}
