import { useState, useMemo } from 'react';
import { View, Text, FlatList, Pressable, TextInput, Modal, ScrollView } from 'react-native';
import { COMMON_EMOJIS, EMOJI_CATEGORIES, searchAllEmojis, useAddReaction } from '@enzyme/shared';

interface ReactionPickerProps {
  visible: boolean;
  messageId: string;
  channelId: string;
  onDismiss: () => void;
}

export function ReactionPicker({ visible, messageId, channelId, onDismiss }: ReactionPickerProps) {
  const [search, setSearch] = useState('');
  const addReaction = useAddReaction(channelId);

  const handleSelect = (emoji: string) => {
    addReaction.mutate({ messageId, emoji });
    onDismiss();
    setSearch('');
  };

  const searchResults = useMemo(() => {
    if (!search.trim()) return null;
    return searchAllEmojis(search.trim(), 50, []);
  }, [search]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onDismiss}>
      <Pressable className="flex-1 bg-black/40" onPress={onDismiss} />

      <View className="h-2/3 rounded-t-2xl bg-white dark:bg-neutral-900">
        {/* Header */}
        <View className="items-center py-2">
          <View className="h-1 w-10 rounded-full bg-neutral-300 dark:bg-neutral-600" />
        </View>

        {/* Search */}
        <View className="px-4 pb-2">
          <TextInput
            className="rounded-lg bg-neutral-100 px-3 py-2 text-base text-neutral-900 dark:bg-neutral-800 dark:text-white"
            placeholder="Search emoji..."
            placeholderTextColor="#9ca3af"
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
          />
        </View>

        {/* Quick reactions */}
        {!search && (
          <View className="flex-row justify-around border-b border-neutral-200 px-4 pb-3 dark:border-neutral-700">
            {COMMON_EMOJIS.slice(0, 6).map((emoji) => (
              <Pressable
                key={emoji}
                className="h-10 w-10 items-center justify-center rounded-lg active:bg-neutral-100 dark:active:bg-neutral-800"
                onPress={() => handleSelect(emoji)}
              >
                <Text className="text-2xl">{emoji}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Emoji grid */}
        {searchResults ? (
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.shortcode}
            numColumns={8}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: 8 }}
            renderItem={({ item }) => (
              <Pressable
                className="flex-1 items-center py-2"
                onPress={() => handleSelect(item.emoji ?? `:${item.shortcode}:`)}
              >
                <Text className="text-2xl">{item.emoji ?? `:${item.shortcode}:`}</Text>
              </Pressable>
            )}
          />
        ) : (
          <ScrollView keyboardShouldPersistTaps="handled">
            {EMOJI_CATEGORIES.map((category) => (
              <View key={category.id} className="px-2">
                <Text className="px-2 pb-1 pt-3 text-xs font-semibold uppercase text-neutral-500 dark:text-neutral-400">
                  {category.label}
                </Text>
                <View className="flex-row flex-wrap">
                  {category.emojis.map((entry) => (
                    <Pressable
                      key={entry.aliases[0]}
                      className="w-[12.5%] items-center py-2"
                      onPress={() => handleSelect(entry.emoji)}
                    >
                      <Text className="text-2xl">{entry.emoji}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}
