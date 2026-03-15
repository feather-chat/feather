import { apiClient, throwIfError } from '@enzyme/api-client';

export const filesApi = {
  signUrl: (fileId: string) =>
    throwIfError(apiClient.POST('/files/{id}/sign-url', { params: { path: { id: fileId } } })),

  signUrls: (fileIds: string[]) =>
    throwIfError(apiClient.POST('/files/sign-urls', { body: { file_ids: fileIds } })),
};
