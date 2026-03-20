import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  authApi,
  ApiError,
  setAuthToken,
  getAuthToken,
  setTokenStorage,
  type LoginInput,
  type RegisterInput,
  type User,
  type WorkspaceSummary,
} from '@enzyme/api-client';

const TOKEN_KEY = 'enzyme_auth_token';

// Plug in localStorage-backed persistence at module load
setTokenStorage({
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  remove: () => localStorage.removeItem(TOKEN_KEY),
});

export function useAuth() {
  const queryClient = useQueryClient();

  const { data, error, isFetched } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authApi.me,
    retry: false,
    staleTime: Infinity, // Never consider stale
    gcTime: Infinity, // Never garbage collect
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    enabled: !!getAuthToken(),
  });

  // 401 error means not authenticated, not an error state
  const isAuthError = error instanceof ApiError && error.status === 401;

  // Clear token on 401 from /auth/me
  useEffect(() => {
    if (isAuthError) {
      setAuthToken(null);
    }
  }, [isAuthError]);

  const loginMutation = useMutation({
    mutationFn: (input: LoginInput) => authApi.login(input),
    onSuccess: (data) => {
      setAuthToken(data.token);
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });

  const registerMutation = useMutation({
    mutationFn: (input: RegisterInput) => authApi.register(input),
    onSuccess: (data) => {
      setAuthToken(data.token);
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      setAuthToken(null);
      queryClient.clear();
    },
  });

  return {
    user: data?.user as User | undefined,
    workspaces: data?.workspaces as WorkspaceSummary[] | undefined,
    isLoading: !isFetched && !!getAuthToken(),
    isAuthenticated: !!data?.user,
    error: isAuthError ? null : error,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    loginError: loginMutation.error,
    registerError: registerMutation.error,
  };
}
