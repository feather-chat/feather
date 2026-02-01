import { useMutation } from '@tanstack/react-query';
import { uploadFile } from '@feather/api-client';

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
      const result = await uploadFile(`/channels/${channelId}/files/upload`, file);
      return result as UploadResult;
    },
  });
}
