import { type ReactNode } from 'react';
import {
  TooltipTrigger,
  Tooltip as AriaTooltip,
  OverlayArrow,
  type TooltipProps as AriaTooltipProps,
} from 'react-aria-components';
import { tv } from 'tailwind-variants';

const tooltip = tv({
  slots: {
    tooltip: [
      'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900',
      'px-2 py-1 rounded text-sm shadow-lg max-w-xs',
      'entering:animate-in entering:fade-in entering:duration-150',
      'exiting:animate-out exiting:fade-out exiting:duration-100',
      'placement-top:mb-1 placement-bottom:mt-1',
    ],
    arrow: 'fill-gray-900 dark:fill-gray-100',
  },
});

interface TooltipProps {
  children: ReactNode;
  content: ReactNode;
  placement?: AriaTooltipProps['placement'];
  delay?: number;
}

export function Tooltip({
  children,
  content,
  placement = 'top',
  delay = 300,
}: TooltipProps) {
  const styles = tooltip();

  return (
    <TooltipTrigger delay={delay}>
      {children}
      <AriaTooltip placement={placement} className={styles.tooltip()}>
        <OverlayArrow>
          <svg
            width={8}
            height={8}
            viewBox="0 0 8 8"
            className={styles.arrow()}
          >
            <path d="M0 0 L4 4 L8 0" />
          </svg>
        </OverlayArrow>
        {content}
      </AriaTooltip>
    </TooltipTrigger>
  );
}
