import { useState, useCallback, useMemo, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Popover, Menu as AriaMenu } from 'react-aria-components';
import { menuStyles } from './menu-styles';
import type { ContextMenuPosition } from '../../hooks/useContextMenu';

interface ContextMenuProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  position: ContextMenuPosition;
  children: ReactNode;
}

export function ContextMenu({ isOpen, onOpenChange, position, children }: ContextMenuProps) {
  const styles = menuStyles();
  const [anchor, setAnchor] = useState<HTMLDivElement | null>(null);

  const anchorRef = useCallback((node: HTMLDivElement | null) => {
    setAnchor(node);
  }, []);

  // Stable ref object for React Aria's Popover triggerRef
  const triggerRef = useMemo(() => ({ current: anchor }), [anchor]);

  return (
    <>
      {/* Only mount the hidden anchor when open to avoid orphaned portal divs */}
      {isOpen &&
        createPortal(
          <div
            ref={anchorRef}
            style={{
              position: 'fixed',
              left: position.x,
              top: position.y,
              width: 0,
              height: 0,
              pointerEvents: 'none',
            }}
          />,
          document.body,
        )}
      {isOpen && anchor && (
        <Popover
          isOpen={isOpen}
          onOpenChange={onOpenChange}
          triggerRef={triggerRef}
          placement="bottom start"
          className={styles.popover()}
        >
          <AriaMenu className={styles.menu()} autoFocus="first" onClose={() => onOpenChange(false)}>
            {children}
          </AriaMenu>
        </Popover>
      )}
    </>
  );
}
