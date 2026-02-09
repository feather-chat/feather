import { get, post, uploadFile, type User } from '@feather/api-client';

export interface UserProfile {
  id: string;
  display_name: string;
  avatar_url?: string;
  status: string;
  created_at: string;
}

export interface UpdateProfileInput {
  display_name?: string;
}

export interface AvatarUploadResponse {
  avatar_url: string;
}

export const usersApi = {
  getUser: (userId: string) => get<{ user: UserProfile }>(`/users/${userId}`),

  updateProfile: (input: UpdateProfileInput) => post<{ user: User }>('/users/me/profile', input),

  uploadAvatar: (file: File) =>
    uploadFile('/users/me/avatar', file) as Promise<AvatarUploadResponse>,

  deleteAvatar: () =>
    fetch('/api/users/me/avatar', {
      method: 'DELETE',
      credentials: 'include',
    }).then(async (res) => {
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Failed to delete avatar');
      }
      return res.json() as Promise<{ success: boolean }>;
    }),
};
