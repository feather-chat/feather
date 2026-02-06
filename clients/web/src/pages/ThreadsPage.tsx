import { useParams } from 'react-router-dom';
import { HashtagIcon, LockClosedIcon, ChatBubbleLeftRightIcon, ChatBubbleLeftEllipsisIcon } from '@heroicons/react/24/outline';
import { useUserThreads } from '../hooks/useThreads';
import { useThreadPanel } from '../hooks/usePanel';
import { Spinner, Avatar } from '../components/ui';
import { cn, formatRelativeTime } from '../lib/utils';
import type { ThreadMessage } from '@feather/api-client';

function ChannelIcon({ type }: { type: string }) {
  switch (type) {
    case 'private':
      return <LockClosedIcon className="h-4 w-4 text-gray-500" />;
    case 'dm':
    case 'group_dm':
      return <ChatBubbleLeftRightIcon className="h-4 w-4 text-gray-500" />;
    default:
      return <HashtagIcon className="h-4 w-4 text-gray-500" />;
  }
}

function ThreadItem({ thread, onOpen }: { thread: ThreadMessage; onOpen: (id: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(thread.id)}
      className="block w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 last:border-b-0"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 pt-1">
          <ChannelIcon type={thread.channel_type} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-gray-500">
              {thread.channel_type === 'dm' || thread.channel_type === 'group_dm'
                ? 'Direct Message'
                : `#${thread.channel_name}`}
            </span>
            {thread.has_new_replies && (
              <span className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0" />
            )}
          </div>
          <div className="flex items-start gap-2">
            <Avatar
              src={thread.user_avatar_url}
              name={thread.user_display_name || 'Unknown'}
              id={thread.user_id}
              size="sm"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className={cn('text-sm font-medium text-gray-700 dark:text-gray-300', thread.has_new_replies && 'font-bold')}>
                  {thread.user_display_name || 'Unknown'}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {thread.content}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
            <span>
              {thread.reply_count} {thread.reply_count === 1 ? 'reply' : 'replies'}
            </span>
            {thread.last_reply_at && (
              <span>
                Last reply {formatRelativeTime(thread.last_reply_at)}
              </span>
            )}
            {thread.thread_participants && thread.thread_participants.length > 0 && (
              <div className="flex -space-x-1">
                {thread.thread_participants.slice(0, 3).map((p) => (
                  <Avatar
                    key={p.user_id}
                    src={p.avatar_url}
                    name={p.display_name || ''}
                    id={p.user_id}
                    size="xs"
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

export function ThreadsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { openThread } = useThreadPanel();
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = useUserThreads({
    workspaceId: workspaceId || '',
  });

  const allThreads = data?.pages.flatMap((page) => page.threads) || [];
  const unreadCount = data?.pages[0]?.unread_thread_count ?? 0;
  const hasThreads = allThreads.length > 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Threads
        </h1>
        <p className="text-sm text-gray-500">
          {hasThreads
            ? `${allThreads.length} thread${allThreads.length === 1 ? '' : 's'}${unreadCount > 0 ? ` (${unreadCount} with new replies)` : ''}`
            : 'No threads yet'}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {!hasThreads ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <ChatBubbleLeftEllipsisIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No threads yet
            </h2>
            <p className="text-sm text-gray-500 max-w-xs">
              Threads you participate in will appear here. Reply to a message to start a thread.
            </p>
          </div>
        ) : (
          <>
            {allThreads.map((thread) => (
              <ThreadItem
                key={thread.id}
                thread={thread}
                onOpen={openThread}
              />
            ))}
            {hasNextPage && (
              <div className="p-4 text-center">
                <button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="text-sm text-primary-600 dark:text-primary-400 hover:underline disabled:opacity-50"
                >
                  {isFetchingNextPage ? 'Loading...' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
