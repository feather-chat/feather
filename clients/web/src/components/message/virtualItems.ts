import type { MessageWithUser } from '@feather/api-client';

export interface DateSeparatorItem {
  type: 'date-separator';
  key: string;
  date: string; // dateString for display
}

export interface UnreadDividerItem {
  type: 'unread-divider';
  key: string;
}

export interface MessageVirtualItem {
  type: 'message';
  key: string;
  message: MessageWithUser;
}

export type VirtualItem = DateSeparatorItem | UnreadDividerItem | MessageVirtualItem;

/**
 * Build a flat array of virtual items from messages (sorted oldest-first).
 * Inserts date separators on day boundaries and an unread divider after lastReadMessageId.
 */
export function buildVirtualItems(
  messages: MessageWithUser[],
  lastReadMessageId?: string,
  unreadCount?: number,
): VirtualItem[] {
  if (messages.length === 0) return [];

  const items: VirtualItem[] = [];
  let currentDateKey = '';
  const lastReadIndex = lastReadMessageId
    ? messages.findIndex((m) => m.id === lastReadMessageId)
    : -1;

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const dateKey = new Date(msg.created_at).toDateString();

    // Insert date separator when day changes
    if (dateKey !== currentDateKey) {
      currentDateKey = dateKey;
      items.push({
        type: 'date-separator',
        key: `date-${dateKey}`,
        date: msg.created_at,
      });
    }

    // Insert message
    items.push({
      type: 'message',
      key: msg.id,
      message: msg,
    });

    // Insert unread divider after the last read message (if there are messages after it)
    if (
      unreadCount &&
      unreadCount > 0 &&
      lastReadIndex !== -1 &&
      i === lastReadIndex &&
      i < messages.length - 1
    ) {
      items.push({
        type: 'unread-divider',
        key: 'unread-divider',
      });
    }
  }

  return items;
}
