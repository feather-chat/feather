import { Button as AriaButton } from 'react-aria-components';
import { BellIcon, BellSlashIcon } from '@heroicons/react/24/outline';
import { SelectMenu, SelectMenuItem, Spinner } from '../ui';
import {
  useThreadSubscription,
  useSubscribeToThread,
  useUnsubscribeFromThread,
} from '../../hooks';
import { cn } from '../../lib/utils';

interface ThreadNotificationButtonProps {
  messageId: string;
}

export function ThreadNotificationButton({ messageId }: ThreadNotificationButtonProps) {
  const { data, isLoading } = useThreadSubscription(messageId);
  const subscribe = useSubscribeToThread();
  const unsubscribe = useUnsubscribeFromThread();

  const subscriptionStatus = data?.status ?? 'none';
  const isSubscribed = subscriptionStatus === 'subscribed';
  const isPending = subscribe.isPending || unsubscribe.isPending;

  const handleSelectionChange = (key: React.Key) => {
    if (key === 'subscribed' && !isSubscribed) {
      subscribe.mutate(messageId);
    } else if (key === 'unsubscribed' && isSubscribed) {
      unsubscribe.mutate(messageId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center p-1">
        <Spinner size="sm" />
      </div>
    );
  }

  const CurrentIcon = isSubscribed ? BellIcon : BellSlashIcon;
  const selectedKey = isSubscribed ? 'subscribed' : 'unsubscribed';

  return (
    <SelectMenu
      selectedKey={selectedKey}
      onSelectionChange={handleSelectionChange}
      trigger={
        <AriaButton
          isDisabled={isPending}
          className={cn(
            'p-1 rounded cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary-500 transition-colors',
            'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700',
            isPending && 'opacity-50 cursor-not-allowed'
          )}
          aria-label="Thread notification settings"
        >
          <CurrentIcon className="w-4 h-4" />
        </AriaButton>
      }
      align="end"
    >
      <SelectMenuItem
        id="subscribed"
        icon={<BellIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />}
      >
        Subscribed
      </SelectMenuItem>
      <SelectMenuItem
        id="unsubscribed"
        icon={<BellSlashIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />}
      >
        Unsubscribed
      </SelectMenuItem>
    </SelectMenu>
  );
}
