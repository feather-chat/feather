import { apiClient, throwIfError, multipartRequest } from '@enzyme/api-client';

export const emojisApi = {
  list: (workspaceId: string) =>
    throwIfError(
      apiClient.POST('/workspaces/{wid}/emojis/list', {
        params: { path: { wid: workspaceId } },
      }),
    ),

  upload: (workspaceId: string, file: File, name: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    return throwIfError(
      apiClient.POST('/workspaces/{wid}/emojis/upload', {
        params: { path: { wid: workspaceId } },
        ...multipartRequest(formData),
      }),
    );
  },

  delete: (emojiId: string) =>
    throwIfError(apiClient.POST('/emojis/{id}/delete', { params: { path: { id: emojiId } } })),
};
