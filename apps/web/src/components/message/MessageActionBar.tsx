import { Button as AriaButton, DialogTrigger, Popover } from 'react-aria-components';
import {
  FaceSmileIcon,
  ChatBubbleBottomCenterTextIcon,
  EllipsisVerticalIcon,
  LinkIcon,
  EyeSlashIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { Tooltip, Menu, MenuItem, EmojiGrid } from '../ui';
import { cn } from '../../lib/utils';
import type { CustomEmoji } from '@enzyme/api-client';

interface MessageActionBarProps {
  reactionPickerOpen: boolean;
  onReactionPickerOpenChange: (open: boolean) => void;
  onReactionSelect: (emoji: string) => void;
  onReplyClick?: () => void;
  onCopyLink: () => void;
  onMarkUnread: () => void;
  showDropdown: boolean;
  onDropdownChange: (open: boolean) => void;
  /** If provided, shows edit option in dropdown */
  onEdit?: () => void;
  /** If provided, shows delete option in dropdown */
  onDelete?: () => void;
  customEmojis?: CustomEmoji[];
}

export function MessageActionBar({
  reactionPickerOpen,
  onReactionPickerOpenChange,
  onReactionSelect,
  onReplyClick,
  onCopyLink,
  onMarkUnread,
  showDropdown,
  onDropdownChange,
  onEdit,
  onDelete,
  customEmojis,
}: MessageActionBarProps) {
  const handleEmojiSelect = (emoji: string) => {
    onReactionSelect(emoji);
    onReactionPickerOpenChange(false);
  };

  return (
    <div
      className={cn(
        'absolute top-0 right-4 flex -translate-y-1/2 items-center rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900',
        showDropdown && 'bg-gray-100 dark:bg-gray-800',
      )}
    >
      <DialogTrigger isOpen={reactionPickerOpen} onOpenChange={onReactionPickerOpenChange}>
        <Tooltip content="Add reaction">
          <AriaButton className="group/btn cursor-pointer rounded-l-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700">
            <FaceSmileIcon className="h-4 w-4 text-gray-500 transition-transform group-hover/btn:scale-110 group-hover/btn:text-gray-700 dark:group-hover/btn:text-gray-300" />
          </AriaButton>
        </Tooltip>
        <Popover placement="bottom end">
          <EmojiGrid onSelect={handleEmojiSelect} customEmojis={customEmojis} />
        </Popover>
      </DialogTrigger>

      {onReplyClick && (
        <Tooltip content="Reply in thread">
          <AriaButton
            onPress={onReplyClick}
            className="group/btn cursor-pointer p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ChatBubbleBottomCenterTextIcon className="h-4 w-4 text-gray-500 transition-transform group-hover/btn:scale-110 group-hover/btn:text-gray-700 dark:group-hover/btn:text-gray-300" />
          </AriaButton>
        </Tooltip>
      )}

      <Tooltip content="More options">
        <Menu
          open={showDropdown}
          onOpenChange={onDropdownChange}
          align="end"
          trigger={
            <AriaButton
              className={cn(
                'group/btn cursor-pointer rounded-r-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700',
                showDropdown && 'bg-gray-100 dark:bg-gray-700',
              )}
              aria-label="More options"
            >
              <EllipsisVerticalIcon className="h-4 w-4 text-gray-500 transition-transform group-hover/btn:scale-110 group-hover/btn:text-gray-700 dark:group-hover/btn:text-gray-300" />
            </AriaButton>
          }
        >
          <MenuItem onAction={onCopyLink} icon={<LinkIcon className="h-4 w-4" />}>
            Copy link to message
          </MenuItem>
          <MenuItem onAction={onMarkUnread} icon={<EyeSlashIcon className="h-4 w-4" />}>
            Mark unread
          </MenuItem>
          {onEdit && (
            <MenuItem onAction={onEdit} icon={<PencilSquareIcon className="h-4 w-4" />}>
              Edit message
            </MenuItem>
          )}
          {onDelete && (
            <MenuItem onAction={onDelete} variant="danger" icon={<TrashIcon className="h-4 w-4" />}>
              Delete message
            </MenuItem>
          )}
        </Menu>
      </Tooltip>
    </div>
  );
}
