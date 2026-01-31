import { get, post, type User } from '@feather/api-client';

export interface UserProfile {
  id: string;
  display_name: string;
  avatar_url?: string;
  status: string;
  created_at: string;
}

export interface UpdateProfileInput {
  display_name?: string;
  avatar_url?: string;
}

export const usersApi = {
  getUser: (userId: string) =>
    get<{ user: UserProfile }>(`/users/${userId}`),

  updateProfile: (input: UpdateProfileInput) =>
    post<{ user: User }>('/users/me/profile', input),
};
