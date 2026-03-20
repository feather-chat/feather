import { describe, it, expect, vi, beforeEach } from 'vitest';

// Each test gets a fresh module to avoid one-shot setTokenStorage conflicts.
async function importClient() {
  const mod = await import('./client');
  return mod;
}

describe('token storage', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('setAuthToken without storage only updates in-memory state', async () => {
    const { setAuthToken, getAuthToken } = await importClient();

    setAuthToken('token-123');

    expect(getAuthToken()).toBe('token-123');
  });

  it('setTokenStorage hydrates from storage.get()', async () => {
    const { setTokenStorage, getAuthToken } = await importClient();
    const storage = { get: () => 'persisted-token', set: vi.fn(), remove: vi.fn() };

    setTokenStorage(storage);

    expect(getAuthToken()).toBe('persisted-token');
  });

  it('setAuthToken delegates to storage.set() when storage is configured', async () => {
    const { setTokenStorage, setAuthToken } = await importClient();
    const storage = { get: () => null, set: vi.fn(), remove: vi.fn() };
    setTokenStorage(storage);

    setAuthToken('new-token');

    expect(storage.set).toHaveBeenCalledWith('new-token');
  });

  it('setAuthToken(null) calls storage.remove()', async () => {
    const { setTokenStorage, setAuthToken } = await importClient();
    const storage = { get: () => 'old-token', set: vi.fn(), remove: vi.fn() };
    setTokenStorage(storage);

    setAuthToken(null);

    expect(storage.remove).toHaveBeenCalled();
    expect(storage.set).not.toHaveBeenCalled();
  });

  it('setTokenStorage throws if called twice', async () => {
    const { setTokenStorage } = await importClient();
    const storage = { get: () => null, set: vi.fn(), remove: vi.fn() };

    setTokenStorage(storage);

    expect(() => setTokenStorage(storage)).toThrow('TokenStorage has already been configured');
  });
});
