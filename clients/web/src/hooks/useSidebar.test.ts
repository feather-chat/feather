import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSidebar } from './useSidebar';

describe('useSidebar', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('returns collapsed state (default false)', () => {
    const { result } = renderHook(() => useSidebar());

    expect(result.current.collapsed).toBe(false);
  });

  it('toggle() flips state', () => {
    const { result } = renderHook(() => useSidebar());

    expect(result.current.collapsed).toBe(false);

    act(() => {
      result.current.toggle();
    });

    expect(result.current.collapsed).toBe(true);

    act(() => {
      result.current.toggle();
    });

    expect(result.current.collapsed).toBe(false);
  });

  it('setCollapsed() sets explicit value', () => {
    const { result } = renderHook(() => useSidebar());

    act(() => {
      result.current.setCollapsed(true);
    });

    expect(result.current.collapsed).toBe(true);

    act(() => {
      result.current.setCollapsed(false);
    });

    expect(result.current.collapsed).toBe(false);
  });

  it('persists to localStorage', () => {
    const { result } = renderHook(() => useSidebar());

    act(() => {
      result.current.setCollapsed(true);
    });

    const stored = localStorage.getItem('feather:sidebar-collapsed');
    expect(stored).toBe('true');
  });

  it('reads initial value from localStorage', () => {
    localStorage.setItem('feather:sidebar-collapsed', 'true');

    const { result } = renderHook(() => useSidebar());

    expect(result.current.collapsed).toBe(true);
  });
});
