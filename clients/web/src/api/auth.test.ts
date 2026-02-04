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

import { authApi } from './auth';

describe('authApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('POST /auth/login with credentials', async () => {
      const user = { id: 'user-1', email: 'test@example.com', display_name: 'Test' };
      mockPost.mockResolvedValue({ user });

      const result = await authApi.login({ email: 'test@example.com', password: 'password123' });

      expect(mockPost).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result).toEqual({ user });
    });
  });

  describe('register', () => {
    it('POST /auth/register with user data', async () => {
      const user = { id: 'user-1', email: 'new@example.com', display_name: 'New User' };
      mockPost.mockResolvedValue({ user });

      const result = await authApi.register({
        email: 'new@example.com',
        password: 'securepass',
        display_name: 'New User',
      });

      expect(mockPost).toHaveBeenCalledWith('/auth/register', {
        email: 'new@example.com',
        password: 'securepass',
        display_name: 'New User',
      });
      expect(result).toEqual({ user });
    });
  });

  describe('logout', () => {
    it('POST /auth/logout', async () => {
      mockPost.mockResolvedValue({ success: true });

      const result = await authApi.logout();

      expect(mockPost).toHaveBeenCalledWith('/auth/logout');
      expect(result).toEqual({ success: true });
    });
  });

  describe('me', () => {
    it('GET /auth/me', async () => {
      const user = { id: 'user-1', email: 'test@example.com', display_name: 'Test' };
      const workspaces = [{ id: 'ws-1', slug: 'test', name: 'Test Workspace', role: 'member' }];
      mockGet.mockResolvedValue({ user, workspaces });

      const result = await authApi.me();

      expect(mockGet).toHaveBeenCalledWith('/auth/me');
      expect(result).toEqual({ user, workspaces });
    });

    it('returns user without workspaces when none exist', async () => {
      const user = { id: 'user-1', email: 'test@example.com', display_name: 'Test' };
      mockGet.mockResolvedValue({ user });

      const result = await authApi.me();

      expect(result).toEqual({ user });
    });
  });

  describe('forgotPassword', () => {
    it('POST /auth/forgot-password with email', async () => {
      mockPost.mockResolvedValue({ success: true, message: 'Reset email sent' });

      const result = await authApi.forgotPassword('user@example.com');

      expect(mockPost).toHaveBeenCalledWith('/auth/forgot-password', {
        email: 'user@example.com',
      });
      expect(result).toEqual({ success: true, message: 'Reset email sent' });
    });
  });

  describe('resetPassword', () => {
    it('POST /auth/reset-password with token and new password', async () => {
      mockPost.mockResolvedValue({ success: true });

      const result = await authApi.resetPassword('reset-token-123', 'newpassword456');

      expect(mockPost).toHaveBeenCalledWith('/auth/reset-password', {
        token: 'reset-token-123',
        new_password: 'newpassword456',
      });
      expect(result).toEqual({ success: true });
    });
  });
});
