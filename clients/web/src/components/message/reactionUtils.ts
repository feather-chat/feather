export interface ReactionGroup {
  emoji: string;
  count: number;
  userIds: string[];
  hasOwn: boolean;
}

/** Helper to group reactions by emoji */
export function groupReactionsByEmoji(
  reactions: Array<{ emoji: string; user_id: string }> | undefined,
  currentUserId: string | undefined,
): ReactionGroup[] {
  const groups = (reactions || []).reduce(
    (acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = {
          emoji: reaction.emoji,
          count: 0,
          userIds: [],
          hasOwn: false,
        };
      }
      acc[reaction.emoji].count++;
      acc[reaction.emoji].userIds.push(reaction.user_id);
      if (reaction.user_id === currentUserId) {
        acc[reaction.emoji].hasOwn = true;
      }
      return acc;
    },
    {} as Record<string, ReactionGroup>,
  );

  return Object.values(groups);
}

/** Helper to create member names lookup */
export function createMemberNamesMap(
  members: Array<{ user_id: string; display_name: string }> | undefined,
): Record<string, string> {
  return (members || []).reduce(
    (acc, member) => {
      acc[member.user_id] = member.display_name;
      return acc;
    },
    {} as Record<string, string>,
  );
}
