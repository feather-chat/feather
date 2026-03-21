import type { MessageWithUser } from '@enzyme/api-client';

export type ListItem =
  | { type: 'message'; data: MessageWithUser }
  | { type: 'date'; date: string; id: string };

export function buildListItems(pages: { messages: MessageWithUser[] }[] | undefined): ListItem[] {
  if (!pages) return [];

  const messages = pages.flatMap((p) => p.messages);
  const items: ListItem[] = [];

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const msgDate = msg.created_at.split('T')[0];
    const prevDate = messages[i + 1]?.created_at.split('T')[0];

    items.push({ type: 'message', data: msg });

    if (prevDate && msgDate !== prevDate) {
      items.push({ type: 'date', date: msg.created_at, id: `date-${msgDate}` });
    }
    if (i === messages.length - 1) {
      items.push({ type: 'date', date: msg.created_at, id: `date-${msgDate}-last` });
    }
  }

  return items;
}
