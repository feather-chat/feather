import {
  RadioGroup as AriaRadioGroup,
  Radio as AriaRadio,
  Label,
  type RadioGroupProps as AriaRadioGroupProps,
  type RadioProps as AriaRadioProps,
} from 'react-aria-components';
import { tv } from 'tailwind-variants';

const radioGroup = tv({
  slots: {
    root: 'space-y-2',
    label: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2',
    radioWrapper: [
      'flex items-center gap-2 cursor-pointer',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 rounded',
    ],
    radio: [
      'flex items-center justify-center',
      'w-4 h-4 rounded-full border-2 transition-colors',
      'border-gray-300 dark:border-gray-600',
      'after:content-[""] after:block after:w-1.5 after:h-1.5 after:rounded-full',
    ],
    radioSelected: 'border-primary-600 bg-primary-600 after:bg-white',
    radioLabel: 'text-sm text-gray-700 dark:text-gray-300 cursor-pointer',
  },
});

interface RadioGroupProps extends Omit<AriaRadioGroupProps, 'className'> {
  label?: string;
  className?: string;
  children: React.ReactNode;
}

export function RadioGroup({ label, className, children, ...props }: RadioGroupProps) {
  const styles = radioGroup();

  return (
    <AriaRadioGroup className={styles.root({ className })} {...props}>
      {label && <Label className={styles.label()}>{label}</Label>}
      <div className="flex gap-4">{children}</div>
    </AriaRadioGroup>
  );
}

interface RadioProps extends Omit<AriaRadioProps, 'className'> {
  children: React.ReactNode;
}

export function Radio({ children, ...props }: RadioProps) {
  const styles = radioGroup();

  return (
    <AriaRadio className={styles.radioWrapper()} {...props}>
      {({ isSelected }) => (
        <>
          <div
            className={styles.radio({ className: isSelected ? styles.radioSelected() : undefined })}
          />
          <span className={styles.radioLabel()}>{children}</span>
        </>
      )}
    </AriaRadio>
  );
}
