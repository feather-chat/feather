import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * URL-based thread panel state
 * Uses ?thread= search param as source of truth
 */
export function useThreadPanel() {
  const [searchParams, setSearchParams] = useSearchParams();
  const threadId = searchParams.get('thread');

  const openThread = useCallback((id: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('thread', id);
      next.delete('profile'); // Close profile when opening thread
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const closeThread = useCallback(() => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.delete('thread');
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  return { threadId, openThread, closeThread };
}

/**
 * URL-based profile panel state
 * Uses ?profile= search param as source of truth
 */
export function useProfilePanel() {
  const [searchParams, setSearchParams] = useSearchParams();
  const profileUserId = searchParams.get('profile');

  const openProfile = useCallback((userId: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('profile', userId);
      next.delete('thread'); // Close thread when opening profile
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const closeProfile = useCallback(() => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.delete('profile');
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  return { profileUserId, openProfile, closeProfile };
}
