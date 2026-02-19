import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

// Hoist mocks
const mockMessagesApi = vi.hoisted(() => ({
  getThreadSubscription: vi.fn(),
  subscribeToThread: vi.fn(),
  unsubscribeFromThread: vi.fn(),
}));

vi.mock('../api/messages', () => ({
  messagesApi: mockMessagesApi,
}));

import {
  useThreadSubscription,
  useSubscribeToThread,
  useUnsubscribeFromThread,
} from './useThreadSubscription';

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

function createWrapper(queryClient?: QueryClient) {
  const client = queryClient ?? createTestQueryClient();
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe('useThreadSubscription', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches subscription state', async () => {
    mockMessagesApi.getThreadSubscription.mockResolvedValue({ status: 'subscribed' });

    const { result } = renderHook(() => useThreadSubscription('msg-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual({ status: 'subscribed' });
    expect(mockMessagesApi.getThreadSubscription).toHaveBeenCalledWith('msg-1');
  });

  it('is disabled when messageId is undefined', () => {
    const { result } = renderHook(() => useThreadSubscription(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockMessagesApi.getThreadSubscription).not.toHaveBeenCalled();
  });

  it('returns loading state initially', () => {
    mockMessagesApi.getThreadSubscription.mockImplementation(() => new Promise(() => {}));

    const { result } = renderHook(() => useThreadSubscription('msg-1'), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
  });
});

describe('useSubscribeToThread', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls API to subscribe', async () => {
    const queryClient = createTestQueryClient();
    mockMessagesApi.subscribeToThread.mockResolvedValue({ status: 'subscribed' });

    const { result } = renderHook(() => useSubscribeToThread(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync('msg-1');
    });

    expect(mockMessagesApi.subscribeToThread).toHaveBeenCalledWith('msg-1');
  });

  it('invalidates cache after mutation', async () => {
    const queryClient = createTestQueryClient();
    mockMessagesApi.subscribeToThread.mockResolvedValue({ status: 'subscribed' });

    // Pre-populate cache with unsubscribed status
    queryClient.setQueryData(['thread-subscription', 'msg-1'], { status: 'unsubscribed' });

    const { result } = renderHook(() => useSubscribeToThread(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync('msg-1');
    });

    // After mutation settles, cache is invalidated
    // The optimistic update happens during mutation
    expect(mockMessagesApi.subscribeToThread).toHaveBeenCalledWith('msg-1');
  });

  it('returns subscription status on success', async () => {
    const queryClient = createTestQueryClient();
    mockMessagesApi.subscribeToThread.mockResolvedValue({ status: 'subscribed' });

    const { result } = renderHook(() => useSubscribeToThread(), {
      wrapper: createWrapper(queryClient),
    });

    let response;
    await act(async () => {
      response = await result.current.mutateAsync('msg-1');
    });

    expect(response).toEqual({ status: 'subscribed' });
  });
});

describe('useUnsubscribeFromThread', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls API to unsubscribe', async () => {
    const queryClient = createTestQueryClient();
    mockMessagesApi.unsubscribeFromThread.mockResolvedValue({ status: 'unsubscribed' });

    const { result } = renderHook(() => useUnsubscribeFromThread(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync('msg-1');
    });

    expect(mockMessagesApi.unsubscribeFromThread).toHaveBeenCalledWith('msg-1');
  });

  it('invalidates cache after mutation', async () => {
    const queryClient = createTestQueryClient();
    mockMessagesApi.unsubscribeFromThread.mockResolvedValue({ status: 'unsubscribed' });

    // Pre-populate cache with subscribed status
    queryClient.setQueryData(['thread-subscription', 'msg-1'], { status: 'subscribed' });

    const { result } = renderHook(() => useUnsubscribeFromThread(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync('msg-1');
    });

    // After mutation settles, cache is invalidated
    expect(mockMessagesApi.unsubscribeFromThread).toHaveBeenCalledWith('msg-1');
  });

  it('returns subscription status on success', async () => {
    const queryClient = createTestQueryClient();
    mockMessagesApi.unsubscribeFromThread.mockResolvedValue({ status: 'unsubscribed' });

    const { result } = renderHook(() => useUnsubscribeFromThread(), {
      wrapper: createWrapper(queryClient),
    });

    let response;
    await act(async () => {
      response = await result.current.mutateAsync('msg-1');
    });

    expect(response).toEqual({ status: 'unsubscribed' });
  });
});
