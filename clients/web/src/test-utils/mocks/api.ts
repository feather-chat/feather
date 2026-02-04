import { vi } from 'vitest';
import type { User, WorkspaceSummary } from '@feather/api-client';
import { createMockUser, createMockWorkspaceSummary } from './fixtures';

// Mock the auth API module
export function mockAuthApi() {
  return vi.hoisted(() => ({
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    me: vi.fn(),
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
  }));
}

// Helper to set up authenticated user state
export function mockAuthenticatedUser(
  mocks: ReturnType<typeof mockAuthApi>,
  user: User = createMockUser(),
  workspaces: WorkspaceSummary[] = [createMockWorkspaceSummary()]
) {
  mocks.me.mockResolvedValue({ user, workspaces });
  return { user, workspaces };
}

// Helper to set up unauthenticated state
export function mockUnauthenticated(mocks: ReturnType<typeof mockAuthApi>) {
  const error = new Error('Unauthorized');
  (error as { status?: number }).status = 401;
  mocks.me.mockRejectedValue(error);
}

// Helper to set up successful login
export function mockLoginSuccess(
  mocks: ReturnType<typeof mockAuthApi>,
  user: User = createMockUser()
) {
  mocks.login.mockResolvedValue({ user });
  return user;
}

// Helper to set up failed login
export function mockLoginFailure(
  mocks: ReturnType<typeof mockAuthApi>,
  message = 'Invalid credentials'
) {
  const error = new Error(message);
  (error as { status?: number }).status = 401;
  mocks.login.mockRejectedValue(error);
}
