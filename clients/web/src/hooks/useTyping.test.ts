import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Hoist mocks
const mockWorkspacesApi = vi.hoisted(() => ({
  startTyping: vi.fn(),
  stopTyping: vi.fn(),
}));

vi.mock('../api/workspaces', () => ({
  workspacesApi: mockWorkspacesApi,
}));

import { useTyping } from './useTyping';

describe('useTyping', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockWorkspacesApi.startTyping.mockResolvedValue({ success: true });
    mockWorkspacesApi.stopTyping.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sends typing start on first call to onTyping', async () => {
    const { result } = renderHook(() => useTyping('ws-1', 'ch-1'));

    await act(async () => {
      result.current.onTyping();
    });

    expect(mockWorkspacesApi.startTyping).toHaveBeenCalledWith('ws-1', 'ch-1');
  });

  it('throttles typing start calls', async () => {
    const { result } = renderHook(() => useTyping('ws-1', 'ch-1'));

    // First call
    await act(async () => {
      result.current.onTyping();
    });

    // Immediate second call should not trigger API
    await act(async () => {
      result.current.onTyping();
    });

    expect(mockWorkspacesApi.startTyping).toHaveBeenCalledTimes(1);
  });

  it('allows typing start after throttle period', async () => {
    const { result } = renderHook(() => useTyping('ws-1', 'ch-1'));

    // First call
    await act(async () => {
      result.current.onTyping();
    });

    expect(mockWorkspacesApi.startTyping).toHaveBeenCalledTimes(1);

    // Advance past throttle period (2000ms)
    await act(async () => {
      vi.advanceTimersByTime(2100);
    });

    // Second call after throttle should work
    await act(async () => {
      result.current.onTyping();
    });

    expect(mockWorkspacesApi.startTyping).toHaveBeenCalledTimes(2);
  });

  it('auto-stops typing after delay', async () => {
    const { result } = renderHook(() => useTyping('ws-1', 'ch-1'));

    await act(async () => {
      result.current.onTyping();
    });

    expect(mockWorkspacesApi.stopTyping).not.toHaveBeenCalled();

    // Advance past stop delay (3000ms)
    await act(async () => {
      vi.advanceTimersByTime(3100);
    });

    expect(mockWorkspacesApi.stopTyping).toHaveBeenCalledWith('ws-1', 'ch-1');
  });

  it('resets auto-stop timer on continued typing', async () => {
    const { result } = renderHook(() => useTyping('ws-1', 'ch-1'));

    await act(async () => {
      result.current.onTyping();
    });

    // Advance part way
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    // Type again - should reset timer
    await act(async () => {
      result.current.onTyping();
    });

    // Advance another 2000ms (4000ms total, but only 2000ms since last typing)
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    // Should not have stopped yet
    expect(mockWorkspacesApi.stopTyping).not.toHaveBeenCalled();

    // Advance past the stop delay from last typing
    await act(async () => {
      vi.advanceTimersByTime(1100);
    });

    expect(mockWorkspacesApi.stopTyping).toHaveBeenCalledTimes(1);
  });

  it('sends typing stop on explicit onStopTyping call', async () => {
    const { result } = renderHook(() => useTyping('ws-1', 'ch-1'));

    await act(async () => {
      result.current.onTyping();
    });

    await act(async () => {
      result.current.onStopTyping();
    });

    expect(mockWorkspacesApi.stopTyping).toHaveBeenCalledWith('ws-1', 'ch-1');
  });

  it('does not send stop if not currently typing', async () => {
    const { result } = renderHook(() => useTyping('ws-1', 'ch-1'));

    await act(async () => {
      result.current.onStopTyping();
    });

    expect(mockWorkspacesApi.stopTyping).not.toHaveBeenCalled();
  });

  it('clears auto-stop timeout on explicit stop', async () => {
    const { result } = renderHook(() => useTyping('ws-1', 'ch-1'));

    await act(async () => {
      result.current.onTyping();
    });

    await act(async () => {
      result.current.onStopTyping();
    });

    expect(mockWorkspacesApi.stopTyping).toHaveBeenCalledTimes(1);

    // Advance past what would be the auto-stop time
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    // Should not have called stop again
    expect(mockWorkspacesApi.stopTyping).toHaveBeenCalledTimes(1);
  });

  it('handles API errors gracefully', async () => {
    mockWorkspacesApi.startTyping.mockRejectedValue(new Error('Network error'));
    mockWorkspacesApi.stopTyping.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useTyping('ws-1', 'ch-1'));

    // Should not throw
    await act(async () => {
      result.current.onTyping();
    });

    await act(async () => {
      result.current.onStopTyping();
    });

    // Test passes if no error is thrown
    expect(true).toBe(true);
  });

  it('uses correct workspace and channel IDs', async () => {
    const { result } = renderHook(() => useTyping('workspace-abc', 'channel-xyz'));

    await act(async () => {
      result.current.onTyping();
    });

    expect(mockWorkspacesApi.startTyping).toHaveBeenCalledWith('workspace-abc', 'channel-xyz');

    await act(async () => {
      result.current.onStopTyping();
    });

    expect(mockWorkspacesApi.stopTyping).toHaveBeenCalledWith('workspace-abc', 'channel-xyz');
  });
});
