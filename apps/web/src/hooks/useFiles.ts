import { useMutation } from '@tanstack/react-query';
import { apiClient, throwIfError, multipartRequest } from '@enzyme/api-client';

export function useUploadFile(channelId: string) {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return throwIfError(
        apiClient.POST('/channels/{id}/files/upload', {
          params: { path: { id: channelId } },
          ...multipartRequest(formData),
        }),
      );
    },
  });
}
