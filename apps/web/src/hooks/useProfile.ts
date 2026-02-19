import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi, type UpdateProfileInput } from '../api/users';

export function useUserProfile(userId: string | null) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => usersApi.getUser(userId!),
    enabled: !!userId,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateProfileInput) => usersApi.updateProfile(input),
    onSuccess: (data) => {
      // Invalidate auth cache to update current user
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      // Invalidate the user profile cache
      if (data.user) {
        queryClient.invalidateQueries({ queryKey: ['user', data.user.id] });
      }
      // Invalidate messages cache so updated display name appears
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      // Also invalidate thread messages
      queryClient.invalidateQueries({ queryKey: ['thread'] });
    },
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => usersApi.uploadAvatar(file),
    onSuccess: () => {
      // Invalidate auth cache to update current user's avatar
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      // Invalidate user profile caches
      queryClient.invalidateQueries({ queryKey: ['user'] });
      // Invalidate messages cache so updated avatar appears
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      // Also invalidate thread messages
      queryClient.invalidateQueries({ queryKey: ['thread'] });
    },
  });
}

export function useDeleteAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => usersApi.deleteAvatar(),
    onSuccess: () => {
      // Invalidate auth cache to update current user's avatar
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      // Invalidate user profile caches
      queryClient.invalidateQueries({ queryKey: ['user'] });
      // Invalidate messages cache so updated avatar appears
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      // Also invalidate thread messages
      queryClient.invalidateQueries({ queryKey: ['thread'] });
    },
  });
}
