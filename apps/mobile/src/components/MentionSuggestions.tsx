import { useMemo } from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import {
  parseMentionTrigger,
  fuzzyMatch,
  useWorkspaceMembers,
  useChannels,
  searchAllEmojis,
  SPECIAL_MENTIONS,
} from '@enzyme/shared';
import { Avatar } from './Avatar';

interface MentionSuggestionsProps {
  text: string;
  cursorPosition: number;
  workspaceId: string;
  onSelect: (token: string, displayText: string) => void;
}

interface Suggestion {
  id: string;
  displayText: string;
  token: string;
  icon?: string;
  avatarUser?: { display_name: string; avatar_url?: string | null; id?: string };
}

export function MentionSuggestions({
  text,
  cursorPosition,
  workspaceId,
  onSelect,
}: MentionSuggestionsProps) {
  const { data: membersData } = useWorkspaceMembers(workspaceId);
  const { data: channelsData } = useChannels(workspaceId);

  const trigger = useMemo(() => parseMentionTrigger(text, cursorPosition), [text, cursorPosition]);

  const suggestions = useMemo<Suggestion[]>(() => {
    if (!trigger?.isActive) return [];

    const query = trigger.query.toLowerCase();

    if (text[trigger.startIndex] === '@') {
      const results: Suggestion[] = [];

      // Special mentions
      for (const special of SPECIAL_MENTIONS) {
        if (!query || fuzzyMatch(query, special.displayName).matches) {
          results.push({
            id: `special-${special.id}`,
            displayText: special.displayName,
            token: `<!${special.id}>`,
            icon: '📢',
          });
        }
      }

      // Members
      const memberList = membersData?.members;
      if (memberList) {
        for (const member of memberList) {
          if (!query || fuzzyMatch(query, member.display_name).matches) {
            results.push({
              id: member.user_id,
              displayText: member.display_name,
              token: `<@${member.user_id}>`,
              avatarUser: {
                display_name: member.display_name,
                avatar_url: member.avatar_url,
                id: member.user_id,
              },
            });
          }
        }
      }

      return results.slice(0, 5);
    }

    if (text[trigger.startIndex] === '#') {
      const channelList = channelsData?.channels;
      if (!channelList) return [];
      const results: Suggestion[] = [];

      for (const ch of channelList) {
        if (ch.type === 'dm' || ch.type === 'group_dm') continue;
        if (!query || fuzzyMatch(query, ch.name).matches) {
          results.push({
            id: ch.id,
            displayText: ch.name,
            token: `<#${ch.id}>`,
            icon: '#',
          });
        }
      }

      return results.slice(0, 5);
    }

    if (text[trigger.startIndex] === ':') {
      if (query.length < 2) return [];
      const emojis = searchAllEmojis(query, 5, []);
      return emojis.map((e) => ({
        id: e.shortcode,
        displayText: e.shortcode,
        token: `:${e.shortcode}:`,
        icon: e.emoji,
      }));
    }

    return [];
  }, [trigger, text, membersData, channelsData]);

  if (suggestions.length === 0) return null;

  return (
    <View className="max-h-52 border-t border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900">
      <FlatList
        data={suggestions}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <Pressable
            className="flex-row items-center px-4 py-2.5 active:bg-neutral-100 dark:active:bg-neutral-800"
            onPress={() => onSelect(item.token, item.displayText)}
          >
            {item.avatarUser ? (
              <Avatar user={item.avatarUser} size="sm" />
            ) : (
              <Text className="w-7 text-center text-base">{item.icon}</Text>
            )}
            <Text className="ml-2 text-base text-neutral-900 dark:text-white">
              {item.displayText}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}
