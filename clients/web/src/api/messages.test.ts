import { describe, it, expect, vi, beforeEach } from 'vitest';

// Hoist mocks
const mockGet = vi.hoisted(() => vi.fn());
const mockPost = vi.hoisted(() => vi.fn());

vi.mock('@feather/api-client', async (importOriginal) => {
  const original = await importOriginal<typeof import('@feather/api-client')>();
  return {
    ...original,
    get: mockGet,
    post: mockPost,
  };
});

import { messagesApi } from './messages';

describe('messagesApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('get', () => {
    it('GET /messages/:id', async () => {
      const message = { id: 'msg-1', content: 'Hello', channel_id: 'ch-1' };
      mockGet.mockResolvedValue({ message });

      const result = await messagesApi.get('msg-1');

      expect(mockGet).toHaveBeenCalledWith('/messages/msg-1');
      expect(result).toEqual({ message });
    });
  });

  describe('send', () => {
    it('POST with channelId and content', async () => {
      const message = { id: 'msg-new', content: 'New message', channel_id: 'ch-1' };
      mockPost.mockResolvedValue({ message });

      const result = await messagesApi.send('ch-1', { content: 'New message' });

      expect(mockPost).toHaveBeenCalledWith('/channels/ch-1/messages/send', {
        content: 'New message',
      });
      expect(result).toEqual({ message });
    });

    it('POST with thread_parent_id for threaded reply', async () => {
      const message = { id: 'msg-reply', content: 'Reply', thread_parent_id: 'msg-parent' };
      mockPost.mockResolvedValue({ message });

      const result = await messagesApi.send('ch-1', {
        content: 'Reply',
        thread_parent_id: 'msg-parent',
      });

      expect(mockPost).toHaveBeenCalledWith('/channels/ch-1/messages/send', {
        content: 'Reply',
        thread_parent_id: 'msg-parent',
      });
      expect(result).toEqual({ message });
    });

    it('POST with attachment_ids', async () => {
      const message = { id: 'msg-attach', content: 'With file', attachment_ids: ['file-1'] };
      mockPost.mockResolvedValue({ message });

      await messagesApi.send('ch-1', {
        content: 'With file',
        attachment_ids: ['file-1'],
      });

      expect(mockPost).toHaveBeenCalledWith('/channels/ch-1/messages/send', {
        content: 'With file',
        attachment_ids: ['file-1'],
      });
    });
  });

  describe('list', () => {
    it('GET with channelId and pagination params', async () => {
      const messages = [{ id: 'msg-1' }, { id: 'msg-2' }];
      mockPost.mockResolvedValue({ messages, has_more: false });

      const result = await messagesApi.list('ch-1', {
        cursor: 'cursor-1',
        limit: 25,
        direction: 'before',
      });

      expect(mockPost).toHaveBeenCalledWith('/channels/ch-1/messages/list', {
        cursor: 'cursor-1',
        limit: 25,
        direction: 'before',
      });
      expect(result).toEqual({ messages, has_more: false });
    });

    it('POST with empty input uses default', async () => {
      mockPost.mockResolvedValue({ messages: [], has_more: false });

      await messagesApi.list('ch-1');

      expect(mockPost).toHaveBeenCalledWith('/channels/ch-1/messages/list', {});
    });
  });

  describe('update', () => {
    it('PATCH with messageId and content', async () => {
      const message = { id: 'msg-1', content: 'Updated content' };
      mockPost.mockResolvedValue({ message });

      const result = await messagesApi.update('msg-1', 'Updated content');

      expect(mockPost).toHaveBeenCalledWith('/messages/msg-1/update', {
        content: 'Updated content',
      });
      expect(result).toEqual({ message });
    });
  });

  describe('delete', () => {
    it('DELETE with messageId', async () => {
      mockPost.mockResolvedValue({ success: true });

      const result = await messagesApi.delete('msg-1');

      expect(mockPost).toHaveBeenCalledWith('/messages/msg-1/delete');
      expect(result).toEqual({ success: true });
    });
  });

  describe('addReaction', () => {
    it('POST reaction with emoji', async () => {
      const reaction = { id: 'r-1', message_id: 'msg-1', user_id: 'user-1', emoji: '👍' };
      mockPost.mockResolvedValue({ reaction });

      const result = await messagesApi.addReaction('msg-1', '👍');

      expect(mockPost).toHaveBeenCalledWith('/messages/msg-1/reactions/add', {
        emoji: '👍',
      });
      expect(result).toEqual({ reaction });
    });
  });

  describe('removeReaction', () => {
    it('DELETE reaction with emoji', async () => {
      mockPost.mockResolvedValue({ success: true });

      const result = await messagesApi.removeReaction('msg-1', '👍');

      expect(mockPost).toHaveBeenCalledWith('/messages/msg-1/reactions/remove', {
        emoji: '👍',
      });
      expect(result).toEqual({ success: true });
    });
  });

  describe('listThread', () => {
    it('GET thread messages with pagination', async () => {
      const messages = [{ id: 'reply-1' }, { id: 'reply-2' }];
      mockPost.mockResolvedValue({ messages, has_more: false });

      const result = await messagesApi.listThread('msg-parent', { limit: 50 });

      expect(mockPost).toHaveBeenCalledWith('/messages/msg-parent/thread/list', {
        limit: 50,
      });
      expect(result).toEqual({ messages, has_more: false });
    });

    it('POST with empty input uses default', async () => {
      mockPost.mockResolvedValue({ messages: [], has_more: false });

      await messagesApi.listThread('msg-parent');

      expect(mockPost).toHaveBeenCalledWith('/messages/msg-parent/thread/list', {});
    });
  });

  describe('markUnread', () => {
    it('POST mark-unread', async () => {
      mockPost.mockResolvedValue({ success: true });

      const result = await messagesApi.markUnread('msg-1');

      expect(mockPost).toHaveBeenCalledWith('/messages/msg-1/mark-unread');
      expect(result).toEqual({ success: true });
    });
  });

  describe('getThreadSubscription', () => {
    it('GET subscription status', async () => {
      mockGet.mockResolvedValue({ status: 'subscribed' });

      const result = await messagesApi.getThreadSubscription('msg-1');

      expect(mockGet).toHaveBeenCalledWith('/messages/msg-1/subscription');
      expect(result).toEqual({ status: 'subscribed' });
    });
  });

  describe('subscribeToThread', () => {
    it('POST subscribe', async () => {
      mockPost.mockResolvedValue({ status: 'subscribed' });

      const result = await messagesApi.subscribeToThread('msg-1');

      expect(mockPost).toHaveBeenCalledWith('/messages/msg-1/subscribe');
      expect(result).toEqual({ status: 'subscribed' });
    });
  });

  describe('unsubscribeFromThread', () => {
    it('POST unsubscribe', async () => {
      mockPost.mockResolvedValue({ status: 'unsubscribed' });

      const result = await messagesApi.unsubscribeFromThread('msg-1');

      expect(mockPost).toHaveBeenCalledWith('/messages/msg-1/unsubscribe');
      expect(result).toEqual({ status: 'unsubscribed' });
    });
  });
});
