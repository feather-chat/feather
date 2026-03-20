import { ApiError } from '@enzyme/api-client';

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  return 'An unexpected error occurred';
}
