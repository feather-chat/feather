import { useNavigate, useParams } from 'react-router-dom';
import { Button as AriaButton, Popover, DialogTrigger } from 'react-aria-components';
import { HashtagIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { tv } from 'tailwind-variants';
import { useChannels } from '../../hooks';
import type { ChannelWithMembership } from '@feather/api-client';

const mentionBadge = tv({
  base: [
    'inline rounded px-0.5 -mx-0.5 cursor-pointer',
    'text-blue-600 dark:text-blue-400',
    'bg-blue-50 dark:bg-blue-900/30',
    'hover:bg-blue-100 dark:hover:bg-blue-900/50',
    'transition-colors',
  ],
});

const popoverStyles = tv({
  slots: {
    popover: [
      'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
      'rounded-lg shadow-lg p-3 min-w-[200px]',
      'entering:animate-in entering:fade-in entering:zoom-in-95 entering:duration-150',
      'exiting:animate-out exiting:fade-out exiting:zoom-out-95 exiting:duration-100',
    ],
    header: 'flex items-center gap-2',
    icon: 'w-5 h-5 text-gray-500 dark:text-gray-400',
    name: 'font-medium text-gray-900 dark:text-white',
    description: 'text-sm text-gray-500 dark:text-gray-400 mt-1',
    goToChannel: [
      'mt-3 w-full text-center text-sm py-1.5 rounded',
      'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600',
      'text-gray-700 dark:text-gray-300',
      'transition-colors cursor-pointer',
    ],
  },
});

interface ChannelMentionBadgeProps {
  channelId: string;
  channels?: ChannelWithMembership[];
}

export function ChannelMentionBadge({ channelId, channels }: ChannelMentionBadgeProps) {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const styles = popoverStyles();

  // Use provided channels or fetch from hook
  const { data: channelsData } = useChannels(channels ? undefined : workspaceId);
  const channelList = channels || channelsData?.channels || [];
  const channel = channelList.find(c => c.id === channelId);

  const channelName = channel?.name || 'unknown-channel';
  const isPrivate = channel?.type === 'private';

  const handleGoToChannel = () => {
    if (workspaceId) {
      navigate(`/workspace/${workspaceId}/channel/${channelId}`);
    }
  };

  return (
    <DialogTrigger>
      <AriaButton className={mentionBadge()}>
        #{channelName}
      </AriaButton>
      <Popover placement="top" className={styles.popover()}>
        <div className={styles.header()}>
          {isPrivate ? (
            <LockClosedIcon className={styles.icon()} />
          ) : (
            <HashtagIcon className={styles.icon()} />
          )}
          <span className={styles.name()}>{channelName}</span>
        </div>
        {channel?.description && (
          <div className={styles.description()}>{channel.description}</div>
        )}
        <button
          type="button"
          onClick={handleGoToChannel}
          className={styles.goToChannel()}
        >
          Go to channel
        </button>
      </Popover>
    </DialogTrigger>
  );
}
