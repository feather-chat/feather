import { type ChangeEvent } from 'react';
import {
  TextField,
  Label,
  Input as AriaInput,
  FieldError,
  type TextFieldProps,
} from 'react-aria-components';
import { tv } from 'tailwind-variants';

const textField = tv({
  slots: {
    root: 'w-full',
    label: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1',
    input: [
      'w-full px-3 py-2 border rounded-md shadow-sm transition-colors',
      'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
      'dark:bg-gray-800 dark:border-gray-600 dark:text-white',
      'placeholder:text-gray-400 dark:placeholder:text-gray-500',
    ],
    error: 'mt-1 text-sm text-red-600 dark:text-red-400',
  },
  variants: {
    isInvalid: {
      true: {
        input: 'border-red-500 focus:ring-red-500 focus:border-red-500',
      },
      false: {
        input: 'border-gray-300',
      },
    },
  },
  defaultVariants: {
    isInvalid: false,
  },
});

interface InputProps extends Omit<TextFieldProps, 'children' | 'className' | 'onChange'> {
  label?: string;
  error?: string;
  className?: string;
  placeholder?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  autoComplete?: string;
}

export function Input({
  label,
  error,
  className,
  placeholder,
  onChange,
  autoComplete,
  ...props
}: InputProps) {
  const styles = textField({ isInvalid: !!error });

  return (
    <TextField
      {...props}
      isInvalid={!!error}
      className={styles.root({ className })}
      onChange={(value) => {
        if (onChange) {
          // Create a synthetic event to match the expected signature
          const syntheticEvent = {
            target: { value },
          } as ChangeEvent<HTMLInputElement>;
          onChange(syntheticEvent);
        }
      }}
    >
      {label && <Label className={styles.label()}>{label}</Label>}
      <AriaInput className={styles.input()} placeholder={placeholder} autoComplete={autoComplete} />
      {error && <FieldError className={styles.error()}>{error}</FieldError>}
    </TextField>
  );
}
