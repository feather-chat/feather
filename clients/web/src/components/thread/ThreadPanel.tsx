import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import {
  XMarkIcon,
  FaceSmileIcon,
} from "@heroicons/react/24/outline";
import {
  useThreadMessages,
  useMessage,
  useAuth,
  useWorkspaceMembers,
} from "../../hooks";
import { useThreadPanel, useProfilePanel } from "../../hooks/usePanel";
import { Avatar, MessageSkeleton } from "../ui";
import { ThreadNotificationButton } from "./ThreadNotificationButton";
import { ReactionPicker } from "../message/ReactionPicker";
import { AttachmentDisplay } from "../message/AttachmentDisplay";
import { MessageContent } from "../message/MessageContent";
import { MessageComposer } from "../message/MessageComposer";
import { cn, formatTime } from "../../lib/utils";
import { messagesApi } from "../../api/messages";
import type { MessageWithUser, MessageListResult, WorkspaceMemberWithUser } from "@feather/api-client";

function ClickableName({
  userId,
  displayName,
}: {
  userId?: string;
  displayName: string;
}) {
  const { openProfile } = useProfilePanel();

  if (!userId) {
    return (
      <span className="font-medium text-gray-900 dark:text-white">
        {displayName}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => openProfile(userId)}
      className="font-medium text-gray-900 dark:text-white hover:underline cursor-pointer"
    >
      {displayName}
    </button>
  );
}

interface ThreadPanelProps {
  messageId: string;
}

export function ThreadPanel({ messageId }: ThreadPanelProps) {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const queryClient = useQueryClient();
  const { closeThread } = useThreadPanel();
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useThreadMessages(messageId);
  const { data: membersData } = useWorkspaceMembers(workspaceId);

  // Try to get parent message from cache first
  const cachedMessage = getParentMessageFromCache(queryClient, messageId);

  // Fetch from API if not in cache (for deep links)
  const {
    data: fetchedData,
    isLoading: isLoadingParent,
    error: parentError,
  } = useMessage(cachedMessage ? undefined : messageId);

  // Use cached message if available, otherwise use fetched
  const parentMessage = cachedMessage || fetchedData?.message;

  // Flatten thread messages (already in chronological order from API)
  const threadMessages = data?.pages.flatMap((page) => page.messages) || [];

  return (
    <div className="w-96 border-l border-gray-200 dark:border-gray-700 flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white">Thread</h3>
        <div className="flex items-center gap-1">
          <ThreadNotificationButton messageId={messageId} />
          <button
            onClick={closeThread}
            className="p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Loading state for parent message */}
      {isLoadingParent && !cachedMessage && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <MessageSkeleton />
        </div>
      )}

      {/* Error state for parent message */}
      {parentError && !parentMessage && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Message not found or you don't have access.
          </p>
        </div>
      )}

      {/* Parent message */}
      {parentMessage && <ParentMessage message={parentMessage} members={membersData?.members} />}

      {/* Thread messages */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <>
            <MessageSkeleton />
            <MessageSkeleton />
          </>
        ) : (
          <>
            {hasNextPage && (
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="w-full py-2 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
              >
                {isFetchingNextPage ? "Loading..." : "Load more replies"}
              </button>
            )}

            {threadMessages.map((message) => (
              <ThreadMessage
                key={message.id}
                message={message}
                parentMessageId={messageId}
                members={membersData?.members}
              />
            ))}
          </>
        )}
      </div>

      {/* Reply composer */}
      {parentMessage && workspaceId && (
        <MessageComposer
          channelId={parentMessage.channel_id}
          workspaceId={workspaceId}
          parentMessageId={messageId}
          variant="thread"
          placeholder="Reply..."
        />
      )}
    </div>
  );
}

function ParentMessage({ message, members }: { message: MessageWithUser; members?: WorkspaceMemberWithUser[] }) {
  const { openProfile } = useProfilePanel();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showActions, setShowActions] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [localReactions, setLocalReactions] = useState(message.reactions || []);

  // Group reactions by emoji
  const reactionGroups = localReactions.reduce(
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
      if (reaction.user_id === user?.id) {
        acc[reaction.emoji].hasOwn = true;
      }
      return acc;
    },
    {} as Record<
      string,
      { emoji: string; count: number; userIds: string[]; hasOwn: boolean }
    >,
  );

  const addReaction = useMutation({
    mutationFn: (emoji: string) => messagesApi.addReaction(message.id, emoji),
    onMutate: async (emoji) => {
      const userId = user?.id || "temp";
      // Check if already reacted
      if (localReactions.some((r) => r.user_id === userId && r.emoji === emoji))
        return;
      // Optimistic local update
      setLocalReactions((prev) => [
        ...prev,
        {
          id: "temp",
          message_id: message.id,
          user_id: userId,
          emoji,
          created_at: new Date().toISOString(),
        },
      ]);
      // Also update messages cache for consistency
      queryClient.setQueriesData(
        { queryKey: ["messages"] },
        (
          old:
            | { pages: MessageListResult[]; pageParams: (string | undefined)[] }
            | undefined,
        ) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              messages: page.messages.map((msg) => {
                if (msg.id !== message.id) return msg;
                const reactions = msg.reactions || [];
                if (
                  reactions.some(
                    (r) => r.user_id === userId && r.emoji === emoji,
                  )
                )
                  return msg;
                return {
                  ...msg,
                  reactions: [
                    ...reactions,
                    {
                      id: "temp",
                      message_id: message.id,
                      user_id: userId,
                      emoji,
                      created_at: new Date().toISOString(),
                    },
                  ],
                };
              }),
            })),
          };
        },
      );
    },
  });

  const removeReaction = useMutation({
    mutationFn: (emoji: string) =>
      messagesApi.removeReaction(message.id, emoji),
    onMutate: async (emoji) => {
      const userId = user?.id;
      // Optimistic local update
      setLocalReactions((prev) =>
        prev.filter((r) => !(r.user_id === userId && r.emoji === emoji)),
      );
      // Also update messages cache for consistency
      queryClient.setQueriesData(
        { queryKey: ["messages"] },
        (
          old:
            | { pages: MessageListResult[]; pageParams: (string | undefined)[] }
            | undefined,
        ) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              messages: page.messages.map((msg) => {
                if (msg.id !== message.id) return msg;
                const reactions = msg.reactions || [];
                return {
                  ...msg,
                  reactions: reactions.filter(
                    (r) => !(r.user_id === userId && r.emoji === emoji),
                  ),
                };
              }),
            })),
          };
        },
      );
    },
  });

  const handleReactionClick = (emoji: string, hasOwn: boolean) => {
    if (hasOwn) {
      removeReaction.mutate(emoji);
    } else {
      addReaction.mutate(emoji);
    }
  };

  const handleAddReaction = (emoji: string) => {
    addReaction.mutate(emoji);
    setShowReactionPicker(false);
  };

  return (
    <div
      className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 relative group"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowReactionPicker(false);
      }}
    >
      <div className="flex items-start gap-3">
        <Avatar
          src={message.user_avatar_url}
          name={message.user_display_name || "Unknown"}
          size="md"
          onClick={
            message.user_id ? () => openProfile(message.user_id!) : undefined
          }
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <ClickableName
              userId={message.user_id}
              displayName={message.user_display_name || "Unknown User"}
            />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatTime(message.created_at)}
            </span>
          </div>
          {message.content && (
            <div className="text-gray-800 dark:text-gray-200 break-words whitespace-pre-wrap">
              <MessageContent content={message.content} members={members} />
            </div>
          )}
          {message.attachments && message.attachments.length > 0 && (
            <AttachmentDisplay attachments={message.attachments} />
          )}

          {/* Reactions */}
          {Object.values(reactionGroups).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {Object.values(reactionGroups).map(({ emoji, count, hasOwn }) => (
                <button
                  key={emoji}
                  onClick={() => handleReactionClick(emoji, hasOwn)}
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-sm border transition-colors",
                    hasOwn
                      ? "bg-primary-100 dark:bg-primary-900/30 border-primary-300 dark:border-primary-700"
                      : "bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600",
                  )}
                >
                  <span>{emoji}</span>
                  <span className="text-xs text-gray-600 dark:text-gray-300">
                    {count}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        {message.reply_count} {message.reply_count === 1 ? "reply" : "replies"}
      </div>

      {/* Action button */}
      {showActions && (
        <button
          onClick={() => setShowReactionPicker(!showReactionPicker)}
          className="absolute right-3 top-3 p-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded shadow-sm hover:bg-gray-100 dark:hover:bg-gray-600"
          title="Add reaction"
        >
          <FaceSmileIcon className="w-4 h-4 text-gray-500" />
        </button>
      )}

      {/* Reaction picker */}
      {showReactionPicker && (
        <div className="absolute right-3 top-12 z-10">
          <ReactionPicker onSelect={handleAddReaction} />
        </div>
      )}
    </div>
  );
}

interface ThreadMessageProps {
  message: MessageWithUser;
  parentMessageId: string;
  members?: WorkspaceMemberWithUser[];
}

function ThreadMessage({ message, parentMessageId, members }: ThreadMessageProps) {
  const { openProfile } = useProfilePanel();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showActions, setShowActions] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  // Group reactions by emoji
  const reactionGroups = (message.reactions || []).reduce(
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
      if (reaction.user_id === user?.id) {
        acc[reaction.emoji].hasOwn = true;
      }
      return acc;
    },
    {} as Record<
      string,
      { emoji: string; count: number; userIds: string[]; hasOwn: boolean }
    >,
  );

  const addReaction = useMutation({
    mutationFn: (emoji: string) => messagesApi.addReaction(message.id, emoji),
    onMutate: async (emoji) => {
      const userId = user?.id || "temp";
      // Update thread cache
      queryClient.setQueryData(
        ["thread", parentMessageId],
        (
          old:
            | { pages: MessageListResult[]; pageParams: (string | undefined)[] }
            | undefined,
        ) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              messages: page.messages.map((msg) => {
                if (msg.id !== message.id) return msg;
                const reactions = msg.reactions || [];
                if (
                  reactions.some(
                    (r) => r.user_id === userId && r.emoji === emoji,
                  )
                )
                  return msg;
                return {
                  ...msg,
                  reactions: [
                    ...reactions,
                    {
                      id: "temp",
                      message_id: message.id,
                      user_id: userId,
                      emoji,
                      created_at: new Date().toISOString(),
                    },
                  ],
                };
              }),
            })),
          };
        },
      );
    },
  });

  const removeReaction = useMutation({
    mutationFn: (emoji: string) =>
      messagesApi.removeReaction(message.id, emoji),
    onMutate: async (emoji) => {
      const userId = user?.id;
      queryClient.setQueryData(
        ["thread", parentMessageId],
        (
          old:
            | { pages: MessageListResult[]; pageParams: (string | undefined)[] }
            | undefined,
        ) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              messages: page.messages.map((msg) => {
                if (msg.id !== message.id) return msg;
                const reactions = msg.reactions || [];
                return {
                  ...msg,
                  reactions: reactions.filter(
                    (r) => !(r.user_id === userId && r.emoji === emoji),
                  ),
                };
              }),
            })),
          };
        },
      );
    },
  });

  const handleReactionClick = (emoji: string, hasOwn: boolean) => {
    if (hasOwn) {
      removeReaction.mutate(emoji);
    } else {
      addReaction.mutate(emoji);
    }
  };

  const handleAddReaction = (emoji: string) => {
    addReaction.mutate(emoji);
    setShowReactionPicker(false);
  };

  return (
    <div
      className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 relative group"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowReactionPicker(false);
      }}
    >
      <div className="flex items-start gap-3">
        <Avatar
          src={message.user_avatar_url}
          name={message.user_display_name || "Unknown"}
          size="sm"
          onClick={
            message.user_id ? () => openProfile(message.user_id!) : undefined
          }
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <ClickableName
              userId={message.user_id}
              displayName={message.user_display_name || "Unknown User"}
            />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatTime(message.created_at)}
            </span>
          </div>
          {message.content && (
            <div className="text-sm text-gray-800 dark:text-gray-200 break-words whitespace-pre-wrap">
              <MessageContent content={message.content} members={members} />
            </div>
          )}
          {message.attachments && message.attachments.length > 0 && (
            <AttachmentDisplay attachments={message.attachments} />
          )}

          {/* Reactions */}
          {Object.values(reactionGroups).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {Object.values(reactionGroups).map(({ emoji, count, hasOwn }) => (
                <button
                  key={emoji}
                  onClick={() => handleReactionClick(emoji, hasOwn)}
                  className={cn(
                    "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs border transition-colors",
                    hasOwn
                      ? "bg-primary-100 dark:bg-primary-900/30 border-primary-300 dark:border-primary-700"
                      : "bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600",
                  )}
                >
                  <span>{emoji}</span>
                  <span className="text-gray-600 dark:text-gray-300">
                    {count}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action button */}
      {showActions && (
        <button
          onClick={() => setShowReactionPicker(!showReactionPicker)}
          className="absolute right-2 top-1 p-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700"
          title="Add reaction"
        >
          <FaceSmileIcon className="w-3.5 h-3.5 text-gray-500" />
        </button>
      )}

      {/* Reaction picker */}
      {showReactionPicker && (
        <div className="absolute right-2 top-8 z-10">
          <ReactionPicker onSelect={handleAddReaction} />
        </div>
      )}
    </div>
  );
}

function getParentMessageFromCache(
  queryClient: ReturnType<typeof useQueryClient>,
  messageId: string,
): MessageWithUser | undefined {
  // Search through all message queries
  const queries = queryClient.getQueriesData<{
    pages: MessageListResult[];
    pageParams: (string | undefined)[];
  }>({ queryKey: ["messages"] });

  for (const [, data] of queries) {
    if (!data) continue;
    for (const page of data.pages) {
      const found = page.messages.find((m) => m.id === messageId);
      if (found) return found;
    }
  }

  return undefined;
}
