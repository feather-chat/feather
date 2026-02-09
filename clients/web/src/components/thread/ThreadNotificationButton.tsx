import { Button as AriaButton } from 'react-aria-components';
import { BellIcon, BellSlashIcon } from '@heroicons/react/24/outline';
import { SelectMenu, SelectMenuItem, Spinner } from '../ui';
import { useThreadSubscription, useSubscribeToThread, useUnsubscribeFromThread } from '../../hooks';
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
            'cursor-pointer rounded p-1 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary-500',
            'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700',
            isPending && 'cursor-not-allowed opacity-50',
          )}
          aria-label="Thread notification settings"
        >
          <CurrentIcon className="h-4 w-4" />
        </AriaButton>
      }
      align="end"
    >
      <SelectMenuItem
        id="subscribed"
        icon={<BellIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />}
      >
        Subscribed
      </SelectMenuItem>
      <SelectMenuItem
        id="unsubscribed"
        icon={<BellSlashIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />}
      >
        Unsubscribed
      </SelectMenuItem>
    </SelectMenu>
  );
}
