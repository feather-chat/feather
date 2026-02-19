import { cn } from '../../lib/utils';

export function DisclosureCaret({
  isExpanded,
  className,
}: {
  isExpanded: boolean;
  className?: string;
}) {
  return (
    <svg
      className={cn('h-3 w-3 transition-transform', isExpanded && 'rotate-90', className)}
      viewBox="0 0 12 12"
      fill="currentColor"
    >
      <path d="M4 2 L8 6 L4 10 Z" />
    </svg>
  );
}
