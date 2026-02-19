import { describe, it, expect } from 'vitest';
import { render } from '../../test-utils';
import { Spinner } from './Spinner';

describe('Spinner', () => {
  it('renders spinner element', () => {
    render(<Spinner />);

    const spinner = document.querySelector('svg');
    expect(spinner).toBeInTheDocument();
  });

  it('has animate-spin class', () => {
    render(<Spinner />);

    const spinner = document.querySelector('svg');
    expect(spinner).toHaveClass('animate-spin');
  });

  it('applies size variant sm', () => {
    render(<Spinner size="sm" />);

    const spinner = document.querySelector('svg');
    expect(spinner).toHaveClass('w-4', 'h-4');
  });

  it('applies size variant md (default)', () => {
    render(<Spinner />);

    const spinner = document.querySelector('svg');
    expect(spinner).toHaveClass('w-6', 'h-6');
  });

  it('applies size variant lg', () => {
    render(<Spinner size="lg" />);

    const spinner = document.querySelector('svg');
    expect(spinner).toHaveClass('w-8', 'h-8');
  });

  it('applies custom className', () => {
    render(<Spinner className="text-red-500" />);

    const spinner = document.querySelector('svg');
    expect(spinner).toHaveClass('text-red-500');
  });
});
