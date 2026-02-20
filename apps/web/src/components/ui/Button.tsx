import { type ReactNode } from 'react';
import { Button as AriaButton, type ButtonProps as AriaButtonProps } from 'react-aria-components';
import { tv, type VariantProps } from 'tailwind-variants';
import { Spinner } from './Spinner';

const button = tv({
  base: [
    'inline-flex items-center justify-center rounded font-medium transition-colors',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'pressed:opacity-90',
  ],
  variants: {
    variant: {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500',
      secondary:
        'bg-gray-200 text-gray-900 hover:bg-gray-300 focus-visible:ring-gray-500 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600',
      ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
    },
    size: {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2',
      lg: 'px-6 py-3 text-lg',
    },
  },
  defaultVariants: {
    variant: 'primary',
    size: 'md',
  },
});

type ButtonVariants = VariantProps<typeof button>;

interface ButtonProps extends Omit<AriaButtonProps, 'className' | 'children'>, ButtonVariants {
  className?: string;
  isLoading?: boolean;
  children: ReactNode;
}

export function Button({
  className,
  variant,
  size,
  isLoading,
  children,
  isDisabled,
  ...props
}: ButtonProps) {
  return (
    <AriaButton
      className={button({ variant, size, className })}
      isDisabled={isDisabled || isLoading}
      {...props}
    >
      {isLoading && <Spinner size="sm" className="mr-2" />}
      {children}
    </AriaButton>
  );
}
