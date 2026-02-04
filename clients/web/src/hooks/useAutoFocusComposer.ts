import { useEffect, type RefObject } from 'react';

interface ComposerRef {
  focus: () => void;
  insertText: (text: string) => void;
}

export function useAutoFocusComposer(
  composerRef: RefObject<ComposerRef | null>,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if any input is focused
      const activeEl = document.activeElement;
      if (activeEl) {
        const tag = activeEl.tagName.toLowerCase();
        if (tag === 'input' || tag === 'textarea' || (activeEl as HTMLElement).isContentEditable) {
          return;
        }
      }

      // Skip modifier combos and special keys
      // e.key.length === 1 means it's a printable character
      if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) {
        return;
      }

      // Prevent default to avoid the keystroke being lost
      e.preventDefault();

      // Focus the editor and insert the typed character
      composerRef.current?.insertText(e.key);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [composerRef, enabled]);
}
