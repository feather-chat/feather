import { describe, it, expect, vi } from 'vitest';
import { render, screen, userEvent } from '../../test-utils';
import { Avatar } from './Avatar';

describe('Avatar', () => {
  it('renders initials when no src provided', () => {
    render(<Avatar name="John Doe" />);

    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('renders image when src is provided', () => {
    render(<Avatar name="John Doe" src="https://example.com/avatar.jpg" />);

    const img = screen.getByRole('img', { name: 'John Doe' });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg');
  });

  it('uses consistent color based on id', () => {
    const { rerender } = render(<Avatar name="John" id="user-123" />);
    const firstRender = screen.getByText('J').className;

    rerender(<Avatar name="John" id="user-123" />);
    const secondRender = screen.getByText('J').className;

    expect(firstRender).toBe(secondRender);
  });

  it('uses primary color when no id provided', () => {
    render(<Avatar name="John" />);

    expect(screen.getByText('J')).toHaveClass('bg-primary-500');
  });

  it('renders different sizes', () => {
    const { rerender } = render(<Avatar name="John" size="xs" />);
    expect(screen.getByText('J')).toHaveClass('w-5', 'h-5');

    rerender(<Avatar name="John" size="sm" />);
    expect(screen.getByText('J')).toHaveClass('w-6', 'h-6');

    rerender(<Avatar name="John" size="md" />);
    expect(screen.getByText('J')).toHaveClass('w-8', 'h-8');

    rerender(<Avatar name="John" size="lg" />);
    expect(screen.getByText('J')).toHaveClass('w-10', 'h-10');
  });

  it('shows online status indicator', () => {
    const { container } = render(<Avatar name="John" status="online" />);

    const statusIndicator = container.querySelector('.bg-green-500');
    expect(statusIndicator).toBeInTheDocument();
  });

  it('shows offline status indicator', () => {
    const { container } = render(<Avatar name="John" status="offline" />);

    const statusIndicator = container.querySelector('.bg-gray-400');
    expect(statusIndicator).toBeInTheDocument();
  });

  it('does not show status indicator when status not provided', () => {
    const { container } = render(<Avatar name="John" />);

    const statusIndicator = container.querySelector('.bg-green-500, .bg-gray-400');
    expect(statusIndicator).not.toBeInTheDocument();
  });

  it('renders as button when onClick provided', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<Avatar name="John" onClick={handleClick} />);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();

    await user.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders as div when onClick not provided', () => {
    render(<Avatar name="John" />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<Avatar name="John" className="custom-class" />);

    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('applies custom style', () => {
    const { container } = render(<Avatar name="John" style={{ marginTop: '10px' }} />);

    const avatar = container.firstChild as HTMLElement;
    expect(avatar.style.marginTop).toBe('10px');
  });
});
