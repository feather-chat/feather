import { useState, useRef, useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils';

interface DropdownProps {
  trigger: ReactNode;
  children: ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  align?: 'left' | 'right';
}

export function Dropdown({ trigger, children, open, onOpenChange, align = 'right' }: DropdownProps) {
  const triggerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, right: 0 });

  // Calculate position when opening
  useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 4, // 4px gap
        left: rect.left,
        right: window.innerWidth - rect.right,
      });
    }
  }, [open]);

  // Handle Escape key
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onOpenChange(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  return (
    <div ref={triggerRef}>
      {trigger}
      {open && createPortal(
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50"
            onClick={() => onOpenChange(false)}
          />
          {/* Content */}
          <div
            className="fixed z-[51] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-[160px]"
            style={{
              top: position.top,
              ...(align === 'right' ? { right: position.right } : { left: position.left }),
            }}
          >
            {children}
          </div>
        </>,
        document.body
      )}
    </div>
  );
}

interface DropdownItemProps {
  children: ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger';
  disabled?: boolean;
  icon?: ReactNode;
}

export function DropdownItem({ children, onClick, variant = 'default', disabled, icon }: DropdownItemProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 whitespace-nowrap',
        'hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed',
        variant === 'danger' ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-200'
      )}
    >
      {icon}
      {children}
    </button>
  );
}
