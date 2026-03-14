import { Dialog as AriaDialog, type DialogProps as AriaDialogProps } from 'react-aria-components';
import { cn } from '../../lib/utils';

export function Dialog({ className, ...props }: AriaDialogProps) {
  return <AriaDialog className={cn('outline-none', className)} {...props} />;
}
