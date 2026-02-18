import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { AvatarStack } from '../ui';
import { useThreadPanel } from '../../hooks/usePanel';
import { formatRelativeTime } from '../../lib/utils';
import type { ThreadParticipant } from '@feather/api-client';

interface ThreadRepliesIndicatorProps {
  messageId: string;
  replyCount: number;
  lastReplyAt?: string;
  threadParticipants?: ThreadParticipant[];
}

export function ThreadRepliesIndicator({
  messageId,
  replyCount,
  lastReplyAt,
  threadParticipants,
}: ThreadRepliesIndicatorProps) {
  const { openThread } = useThreadPanel();

  if (replyCount === 0) {
    return null;
  }

  return (
    <button
      onClick={() => openThread(messageId)}
      className="group/thread -mx-2 mt-2 flex min-w-[300px] items-center gap-2 rounded-lg border border-transparent px-2 py-1 hover:border hover:border-gray-200 hover:bg-white dark:hover:border-gray-700 dark:hover:bg-gray-900"
    >
      {threadParticipants && threadParticipants.length > 0 && (
        <AvatarStack users={threadParticipants} showCount={false} />
      )}
      <span className="text-primary-600 dark:text-primary-400 text-sm">
        {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
      </span>
      {lastReplyAt && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Last reply {formatRelativeTime(lastReplyAt)}
        </span>
      )}
      <ChevronRightIcon className="ml-auto h-4 w-4 text-gray-400 opacity-0 group-hover/thread:opacity-100 dark:text-gray-500" />
    </button>
  );
}
