import { useMutation } from '@tanstack/react-query';
import { apiClient, throwIfError, multipartRequest } from '@enzyme/api-client';

export interface UploadedFile {
  id: string;
  filename: string;
  size: number;
  content_type: string;
}

export interface UploadResult {
  file: UploadedFile;
}

export function useUploadFile(channelId: string) {
  return useMutation({
    mutationFn: async (file: File): Promise<UploadResult> => {
      const formData = new FormData();
      formData.append('file', file);
      const result = await throwIfError(
        apiClient.POST('/channels/{id}/files/upload', {
          params: { path: { id: channelId } },
          ...multipartRequest(formData),
        }),
      );
      return result as UploadResult;
    },
  });
}
