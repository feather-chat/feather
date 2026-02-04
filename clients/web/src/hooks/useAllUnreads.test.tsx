import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

// Hoist mocks
const mockPost = vi.hoisted(() => vi.fn());

vi.mock('@feather/api-client', async (importOriginal) => {
  const original = await importOriginal<typeof import('@feather/api-client')>();
  return {
    ...original,
    post: mockPost,
  };
});

import { useAllUnreads } from './useAllUnreads';

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

describe('useAllUnreads', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches unreads with workspaceId', async () => {
    const unreadsResult = {
      messages: [
        { id: 'msg-1', channel_id: 'ch-1', content: 'Unread message' },
      ],
      next_cursor: undefined,
    };
    mockPost.mockResolvedValue(unreadsResult);

    const { result } = renderHook(
      () => useAllUnreads({ workspaceId: 'ws-1' }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockPost).toHaveBeenCalledWith('/workspaces/ws-1/unreads', {
      limit: 50,
      cursor: undefined,
    });
    expect(result.current.data?.pages[0]).toEqual(unreadsResult);
  });

  it('supports pagination (infinite query)', async () => {
    const firstPage = {
      messages: [{ id: 'msg-1', content: 'First' }],
      next_cursor: 'cursor-1',
    };
    mockPost.mockResolvedValue(firstPage);

    const { result } = renderHook(
      () => useAllUnreads({ workspaceId: 'ws-1' }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.hasNextPage).toBe(true);
  });

  it('disabled when workspaceId is empty', () => {
    const { result } = renderHook(
      () => useAllUnreads({ workspaceId: '' }),
      { wrapper: createWrapper() }
    );

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockPost).not.toHaveBeenCalled();
  });

  it('disabled when enabled option is false', () => {
    const { result } = renderHook(
      () => useAllUnreads({ workspaceId: 'ws-1', enabled: false }),
      { wrapper: createWrapper() }
    );

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockPost).not.toHaveBeenCalled();
  });

  it('returns loading state initially', () => {
    mockPost.mockImplementation(() => new Promise(() => {}));

    const { result } = renderHook(
      () => useAllUnreads({ workspaceId: 'ws-1' }),
      { wrapper: createWrapper() }
    );

    expect(result.current.isLoading).toBe(true);
  });
});
