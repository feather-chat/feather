import { tv } from 'tailwind-variants';

export const menuStyles = tv({
  slots: {
    popover: [
      'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
      'rounded-lg shadow-lg py-1 min-w-[160px] z-50',
      'entering:animate-in entering:fade-in entering:zoom-in-95 entering:duration-150',
      'exiting:animate-out exiting:fade-out exiting:zoom-out-95 exiting:duration-100',
    ],
    menu: 'outline-none',
    item: [
      'w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 whitespace-nowrap cursor-pointer',
      'outline-none',
      'focus:bg-gray-100 dark:focus:bg-gray-700',
      'disabled:opacity-50 disabled:cursor-not-allowed',
    ],
    section: '',
    header: 'px-3 py-2 border-b border-gray-200 dark:border-gray-700',
    separator: 'border-t border-gray-200 dark:border-gray-700 my-1',
  },
  variants: {
    variant: {
      default: {
        item: 'text-gray-700 dark:text-gray-200',
      },
      danger: {
        item: 'text-red-600 dark:text-red-400',
      },
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});
