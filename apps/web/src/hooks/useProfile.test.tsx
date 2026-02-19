import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { createMockUser } from '../test-utils';

// Hoist mocks
const mockUsersApi = vi.hoisted(() => ({
  getUser: vi.fn(),
  updateProfile: vi.fn(),
  uploadAvatar: vi.fn(),
  deleteAvatar: vi.fn(),
}));

vi.mock('../api/users', () => ({
  usersApi: mockUsersApi,
}));

import { useUserProfile, useUpdateProfile, useUploadAvatar, useDeleteAvatar } from './useProfile';

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

describe('useUserProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches user by ID', async () => {
    const user = createMockUser({ id: 'user-1', display_name: 'Test User' });
    mockUsersApi.getUser.mockResolvedValue({ user });

    const { result } = renderHook(() => useUserProfile('user-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.user).toEqual(user);
    expect(mockUsersApi.getUser).toHaveBeenCalledWith('user-1');
  });

  it('is disabled when userId is null', () => {
    const { result } = renderHook(() => useUserProfile(null), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockUsersApi.getUser).not.toHaveBeenCalled();
  });

  it('returns loading state initially', () => {
    mockUsersApi.getUser.mockImplementation(() => new Promise(() => {}));

    const { result } = renderHook(() => useUserProfile('user-1'), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
  });
});

describe('useUpdateProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls API with display_name', async () => {
    const queryClient = createTestQueryClient();
    const user = createMockUser({ id: 'user-1', display_name: 'Updated Name' });
    mockUsersApi.updateProfile.mockResolvedValue({ user });

    const { result } = renderHook(() => useUpdateProfile(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({ display_name: 'Updated Name' });
    });

    expect(mockUsersApi.updateProfile).toHaveBeenCalledWith({ display_name: 'Updated Name' });
  });

  it('returns updated user on success', async () => {
    const queryClient = createTestQueryClient();
    const user = createMockUser({ id: 'user-1', display_name: 'New Name' });
    mockUsersApi.updateProfile.mockResolvedValue({ user });

    const { result } = renderHook(() => useUpdateProfile(), {
      wrapper: createWrapper(queryClient),
    });

    let response;
    await act(async () => {
      response = await result.current.mutateAsync({ display_name: 'New Name' });
    });

    expect(response).toEqual({ user });
  });
});

describe('useUploadAvatar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls API with file', async () => {
    const queryClient = createTestQueryClient();
    mockUsersApi.uploadAvatar.mockResolvedValue({ avatar_url: 'https://example.com/avatar.jpg' });

    const file = new File(['test'], 'avatar.jpg', { type: 'image/jpeg' });

    const { result } = renderHook(() => useUploadAvatar(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync(file);
    });

    expect(mockUsersApi.uploadAvatar).toHaveBeenCalledWith(file);
  });

  it('returns avatar_url on success', async () => {
    const queryClient = createTestQueryClient();
    mockUsersApi.uploadAvatar.mockResolvedValue({
      avatar_url: 'https://example.com/new-avatar.jpg',
    });

    const file = new File(['test'], 'avatar.jpg', { type: 'image/jpeg' });

    const { result } = renderHook(() => useUploadAvatar(), {
      wrapper: createWrapper(queryClient),
    });

    let response;
    await act(async () => {
      response = await result.current.mutateAsync(file);
    });

    expect(response).toEqual({ avatar_url: 'https://example.com/new-avatar.jpg' });
  });
});

describe('useDeleteAvatar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls API to delete avatar', async () => {
    const queryClient = createTestQueryClient();
    mockUsersApi.deleteAvatar.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useDeleteAvatar(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync();
    });

    expect(mockUsersApi.deleteAvatar).toHaveBeenCalled();
  });

  it('returns success on delete', async () => {
    const queryClient = createTestQueryClient();
    mockUsersApi.deleteAvatar.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useDeleteAvatar(), {
      wrapper: createWrapper(queryClient),
    });

    let response;
    await act(async () => {
      response = await result.current.mutateAsync();
    });

    expect(response).toEqual({ success: true });
  });
});
