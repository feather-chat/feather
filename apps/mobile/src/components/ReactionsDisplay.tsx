import { Text, Pressable, ScrollView } from 'react-native';
import { useAddReaction, useRemoveReaction } from '@enzyme/shared';
import type { Reaction } from '@enzyme/api-client';

interface ReactionsDisplayProps {
  reactions: Reaction[];
  messageId: string;
  channelId: string;
  currentUserId?: string;
  onAddReaction?: () => void;
}

interface ReactionGroup {
  emoji: string;
  count: number;
  userIds: string[];
  hasReacted: boolean;
}

function groupReactions(reactions: Reaction[], currentUserId?: string): ReactionGroup[] {
  const groups = new Map<string, ReactionGroup>();

  for (const r of reactions) {
    const existing = groups.get(r.emoji);
    if (existing) {
      existing.count++;
      existing.userIds.push(r.user_id);
      if (r.user_id === currentUserId) existing.hasReacted = true;
    } else {
      groups.set(r.emoji, {
        emoji: r.emoji,
        count: 1,
        userIds: [r.user_id],
        hasReacted: r.user_id === currentUserId,
      });
    }
  }

  return Array.from(groups.values());
}

export function ReactionsDisplay({
  reactions,
  messageId,
  channelId,
  currentUserId,
  onAddReaction,
}: ReactionsDisplayProps) {
  const addReaction = useAddReaction(channelId);
  const removeReaction = useRemoveReaction(channelId);

  const groups = groupReactions(reactions, currentUserId);

  if (groups.length === 0) return null;

  const handlePress = (group: ReactionGroup) => {
    if (group.hasReacted) {
      removeReaction.mutate({ messageId, emoji: group.emoji });
    } else {
      addReaction.mutate({ messageId, emoji: group.emoji });
    }
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="mt-1"
      contentContainerStyle={{ gap: 4 }}
    >
      {groups.map((group) => (
        <Pressable
          key={group.emoji}
          className={`flex-row items-center rounded-full border px-2 py-0.5 ${
            group.hasReacted
              ? 'border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/30'
              : 'border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800'
          }`}
          onPress={() => handlePress(group)}
        >
          <Text className="text-sm">{group.emoji}</Text>
          <Text
            className={`ml-1 text-xs font-medium ${
              group.hasReacted
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-neutral-600 dark:text-neutral-400'
            }`}
          >
            {group.count}
          </Text>
        </Pressable>
      ))}

      {/* Add reaction button */}
      <Pressable
        className="items-center justify-center rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 dark:border-neutral-700 dark:bg-neutral-800"
        onPress={onAddReaction}
      >
        <Text className="text-sm text-neutral-400">+</Text>
      </Pressable>
    </ScrollView>
  );
}
