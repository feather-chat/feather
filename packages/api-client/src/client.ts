import createClient from 'openapi-fetch';
import type { paths } from '../generated/schema';
import type { ApiErrorResponse } from './types';

let apiBase = '/api';
let apiClient = createApiClient(apiBase);

function createApiClient(baseUrl: string) {
  const client = createClient<paths>({ baseUrl });
  client.use({
    async onRequest({ request }) {
      const token = getAuthToken();
      if (token) {
        request.headers.set('Authorization', `Bearer ${token}`);
      }
      return request;
    },
  });
  return client;
}

export { apiClient };

export function setApiBase(url: string): void {
  apiBase = url;
  apiClient = createApiClient(url);
}

export function getApiBase(): string {
  return apiBase;
}

export type TokenStorage = {
  readonly get: () => string | null;
  readonly set: (token: string) => void;
  readonly remove: () => void;
};

let tokenStorage: TokenStorage | null = null;
let authToken: string | null = null;

/**
 * Register a persistence backend for auth tokens. Must be called before
 * any {@link setAuthToken} calls that need to survive across page loads.
 * Immediately reads the stored token into memory via `storage.get()`.
 *
 * Can only be called once — throws if a storage backend is already registered.
 * The storage interface is synchronous by design (localStorage, Electron safeStorage, etc.).
 */
export function setTokenStorage(storage: TokenStorage): void {
  if (tokenStorage !== null) {
    throw new Error('TokenStorage has already been configured');
  }
  tokenStorage = storage;
  authToken = storage.get();
}

export function setAuthToken(token: string | null): void {
  authToken = token;
  if (tokenStorage) {
    if (token) {
      tokenStorage.set(token);
    } else {
      tokenStorage.remove();
    }
  }
}

export function getAuthToken(): string | null {
  return authToken;
}

export class ApiError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

export async function throwIfError<T>(
  promise: Promise<{ data?: T; error?: unknown; response: Response }>,
): Promise<T> {
  const { data, error, response } = await promise;
  if (error) {
    let code = 'UNKNOWN_ERROR';
    let message = 'An unknown error occurred';
    if (typeof error === 'object' && error !== null) {
      const apiErr = error as ApiErrorResponse;
      code = apiErr.error?.code || code;
      message = apiErr.error?.message || message;
    }
    throw new ApiError(code, message, response.status);
  }
  if (data === undefined) {
    throw new ApiError('EMPTY_RESPONSE', 'No data returned', response.status);
  }
  return data;
}

// openapi-fetch lacks typed multipart support, so we bypass body type
// checking with `as never` and provide a custom serializer that returns
// the FormData directly instead of JSON-encoding it.
export function multipartRequest(formData: FormData) {
  return {
    body: formData as never,
    bodySerializer: () => formData,
  };
}

export function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  return headers;
}
