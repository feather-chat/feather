import { describe, it, expect, vi } from 'vitest';
import { render, screen, userEvent } from '../../test-utils';
import { Input } from './Input';

describe('Input', () => {
  it('renders without label', () => {
    render(<Input placeholder="Enter text" />);

    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('renders with label', () => {
    render(<Input label="Email" />);

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('displays error message when error prop is provided', () => {
    render(<Input label="Email" error="Email is required" />);

    expect(screen.getByText('Email is required')).toBeInTheDocument();
  });

  it('applies invalid styles when error is present', () => {
    render(<Input label="Email" error="Invalid email" />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('border-red-500');
  });

  it('is disabled when isDisabled is true', () => {
    render(<Input label="Email" isDisabled />);

    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('is required when isRequired is true', () => {
    render(<Input label="Email" isRequired />);

    expect(screen.getByRole('textbox')).toBeRequired();
  });

  it('calls onChange when value changes', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(<Input label="Name" onChange={handleChange} />);

    await user.type(screen.getByRole('textbox'), 'John');

    // onChange is called for each character typed
    expect(handleChange).toHaveBeenCalled();
    expect(handleChange.mock.calls[0][0].target.value).toBe('J');
  });

  it('renders with custom className', () => {
    const { container } = render(<Input className="custom-class" />);

    // The TextField wrapper should have the custom class
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('sets autoComplete attribute', () => {
    render(<Input label="Email" autoComplete="email" />);

    expect(screen.getByRole('textbox')).toHaveAttribute('autocomplete', 'email');
  });

  it('supports password type', () => {
    render(<Input label="Password" type="password" />);

    // Password inputs have a different role
    const input = document.querySelector('input[type="password"]');
    expect(input).toBeInTheDocument();
  });
});
