import type { SignedUrl } from '@enzyme/api-client';
import { post } from '@enzyme/api-client';

export const filesApi = {
  signUrl: (fileId: string) => post<SignedUrl>(`/files/${fileId}/sign-url`),
  signUrls: (fileIds: string[]) =>
    post<{ urls: SignedUrl[] }>('/files/sign-urls', { file_ids: fileIds }),
};
