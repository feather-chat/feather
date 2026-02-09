import { describe, it, expect } from 'vitest';
import { render } from '../../test-utils';
import { Skeleton, MessageSkeleton, ChannelListSkeleton } from './Skeleton';

describe('Skeleton', () => {
  it('renders with animate-pulse class', () => {
    const { container } = render(<Skeleton />);

    const skeleton = container.querySelector('div');
    expect(skeleton).toHaveClass('animate-pulse');
  });

  it('renders with base styling', () => {
    const { container } = render(<Skeleton />);

    const skeleton = container.querySelector('div');
    expect(skeleton).toHaveClass('bg-gray-200', 'rounded');
  });

  it('applies custom className', () => {
    const { container } = render(<Skeleton className="h-8 w-32" />);

    const skeleton = container.querySelector('div');
    expect(skeleton).toHaveClass('w-32', 'h-8');
  });
});

describe('MessageSkeleton', () => {
  it('renders avatar placeholder', () => {
    render(<MessageSkeleton />);

    // Avatar is a rounded-full skeleton
    const avatar = document.querySelector('.rounded-full');
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveClass('animate-pulse');
  });

  it('renders content placeholders', () => {
    const { container } = render(<MessageSkeleton />);

    // Should have multiple skeleton elements for name, timestamp, and content lines
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThanOrEqual(4); // avatar + name + timestamp + content lines
  });

  it('renders name and timestamp row', () => {
    const { container } = render(<MessageSkeleton />);

    // Check for name placeholder (w-24)
    const namePlaceholder = container.querySelector('.w-24');
    expect(namePlaceholder).toBeInTheDocument();

    // Check for timestamp placeholder (w-12)
    const timestampPlaceholder = container.querySelector('.w-12');
    expect(timestampPlaceholder).toBeInTheDocument();
  });
});

describe('ChannelListSkeleton', () => {
  it('renders multiple channel placeholders', () => {
    const { container } = render(<ChannelListSkeleton />);

    // Should render 5 channel skeleton items
    const items = container.querySelectorAll('.flex.items-center.gap-2');
    expect(items).toHaveLength(5);
  });

  it('renders icon and name placeholders for each channel', () => {
    const { container } = render(<ChannelListSkeleton />);

    // Each channel row has an icon placeholder (w-4 h-4) and a name placeholder
    const iconPlaceholders = container.querySelectorAll('.w-4.h-4');
    expect(iconPlaceholders.length).toBeGreaterThanOrEqual(5);
  });

  it('has animate-pulse on skeleton elements', () => {
    const { container } = render(<ChannelListSkeleton />);

    const pulseElements = container.querySelectorAll('.animate-pulse');
    expect(pulseElements.length).toBeGreaterThan(0);
  });
});
