import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';

const SIDEBAR_KEY = 'feather:sidebar-collapsed';

/**
 * localStorage-backed sidebar collapse state
 */
export function useSidebar() {
  const [collapsed, setCollapsed] = useLocalStorage(SIDEBAR_KEY, false);

  const toggle = useCallback(() => {
    setCollapsed(prev => !prev);
  }, [setCollapsed]);

  return { collapsed, toggle, setCollapsed };
}
