import { useState, useCallback, useEffect } from 'react';

export interface ContextMenuPosition {
  x: number;
  y: number;
}

export function useContextMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<ContextMenuPosition>({ x: 0, y: 0 });

  const onContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setPosition({ x: e.clientX, y: e.clientY });
    setIsOpen(true);
  }, []);

  // Close on scroll or right-click elsewhere
  useEffect(() => {
    if (!isOpen) return;

    const handleScroll = () => setIsOpen(false);
    const handleContextMenu = () => setIsOpen(false);

    document.addEventListener('scroll', handleScroll, true);
    document.addEventListener('contextmenu', handleContextMenu, true);
    return () => {
      document.removeEventListener('scroll', handleScroll, true);
      document.removeEventListener('contextmenu', handleContextMenu, true);
    };
  }, [isOpen]);

  return { isOpen, setIsOpen, position, onContextMenu };
}
