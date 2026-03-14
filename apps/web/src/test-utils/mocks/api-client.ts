import { vi } from 'vitest';

export function createMockApiClient() {
  return {
    GET: vi.fn(),
    POST: vi.fn(),
    DELETE: vi.fn(),
  };
}

export async function mockThrowIfError(promise: Promise<{ data?: unknown; error?: unknown }>) {
  const { data, error } = await promise;
  if (error) throw error;
  return data;
}

export function mockResponse(data: unknown) {
  return { data, response: new Response() };
}
