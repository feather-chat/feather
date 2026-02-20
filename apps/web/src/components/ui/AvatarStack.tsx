import { Avatar } from './Avatar';
import { cn } from '../../lib/utils';

interface AvatarStackUser {
  user_id: string;
  display_name?: string;
  avatar_url?: string | null;
  gravatar_url?: string | null;
}

interface AvatarStackProps {
  users: AvatarStackUser[];
  max?: number;
  size?: 'xs' | 'sm';
  showCount?: boolean;
  className?: string;
}

export function AvatarStack({
  users,
  max = 3,
  size = 'xs',
  showCount = true,
  className,
}: AvatarStackProps) {
  const visibleUsers = users.slice(0, max);
  const remainingCount = users.length - max;

  return (
    <div className={cn('flex -space-x-1.5', className)}>
      {visibleUsers.map((user, index) => (
        <Avatar
          key={user.user_id}
          src={user.avatar_url}
          gravatarSrc={user.gravatar_url}
          name={user.display_name || 'User'}
          id={user.user_id}
          size={size}
          className="ring-2 ring-[var(--avatar-ring)]"
          style={{ zIndex: visibleUsers.length - index }}
        />
      ))}
      {showCount && remainingCount > 0 && (
        <div
          className={cn(
            'flex items-center justify-center rounded-full bg-gray-200 font-medium text-gray-600 ring-2 ring-[var(--avatar-ring)] dark:bg-gray-700 dark:text-gray-300',
            size === 'xs' ? 'h-5 w-5 text-[9px]' : 'h-6 w-6 text-[10px]',
          )}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}
