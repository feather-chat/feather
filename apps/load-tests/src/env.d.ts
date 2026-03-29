// Type declarations for K6 community extensions

declare module 'k6/x/sse' {
  interface SSEEvent {
    id: string;
    name: string;
    data: string;
    comment: string;
  }

  interface SSEClient {
    on(event: 'open', callback: () => void): void;
    on(event: 'event', callback: (event: SSEEvent) => void): void;
    on(event: 'error', callback: (error: Error) => void): void;
    on(event: string, callback: (event: SSEEvent) => void): void;
    close(): void;
  }

  interface SSEParams {
    headers?: Record<string, string>;
    tags?: Record<string, string>;
    timeout?: string;
    method?: string;
    body?: string;
  }

  interface SSEResponse {
    status: number;
    url: string;
    headers: Record<string, string>;
    error: string;
  }

  function open(url: string, params: SSEParams, callback: (client: SSEClient) => void): SSEResponse;

  function open(url: string, callback: (client: SSEClient) => void): SSEResponse;

  export default { open };
}
