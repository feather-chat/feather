import { describe, it, expect } from 'vitest';
import { render, screen } from '../../test-utils';
import { AvatarStack } from './AvatarStack';

const mockUsers = [
  { user_id: 'user-1', display_name: 'Alice', avatar_url: 'https://example.com/alice.jpg' },
  { user_id: 'user-2', display_name: 'Bob', avatar_url: 'https://example.com/bob.jpg' },
  { user_id: 'user-3', display_name: 'Charlie', avatar_url: 'https://example.com/charlie.jpg' },
  { user_id: 'user-4', display_name: 'Diana', avatar_url: 'https://example.com/diana.jpg' },
  { user_id: 'user-5', display_name: 'Eve', avatar_url: 'https://example.com/eve.jpg' },
];

const mockUsersWithInitials = [
  { user_id: 'user-1', display_name: 'Alice', avatar_url: null },
  { user_id: 'user-2', display_name: 'Bob', avatar_url: null },
  { user_id: 'user-3', display_name: 'Charlie', avatar_url: null },
];

describe('AvatarStack', () => {
  it('renders avatars up to max limit', () => {
    render(<AvatarStack users={mockUsers} max={3} />);

    // Should only show 3 avatars (not 5)
    const avatars = screen.getAllByRole('img');
    expect(avatars).toHaveLength(3);
  });

  it('shows +N count for overflow', () => {
    render(<AvatarStack users={mockUsers} max={3} />);

    // 5 users, max 3 shown, so +2 remaining
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('does not show count when showCount is false', () => {
    render(<AvatarStack users={mockUsers} max={3} showCount={false} />);

    // Should not have the +N indicator
    expect(screen.queryByText('+2')).not.toBeInTheDocument();
  });

  it('does not show count when all users fit within max', () => {
    const twoUsers = mockUsers.slice(0, 2);
    render(<AvatarStack users={twoUsers} max={3} />);

    // 2 users, max 3, so no overflow
    expect(screen.queryByText(/^\+\d+$/)).not.toBeInTheDocument();
  });

  it('renders overflow indicator with correct styling', () => {
    const { container } = render(<AvatarStack users={mockUsers} max={2} size="xs" />);

    // Should show +3 overflow indicator
    expect(screen.getByText('+3')).toBeInTheDocument();

    // The overflow indicator should exist
    const wrapper = container.querySelector('.flex.-space-x-1\\.5');
    expect(wrapper).toBeInTheDocument();
  });

  it('handles empty array', () => {
    const { container } = render(<AvatarStack users={[]} />);

    // Should render empty container
    expect(container.querySelector('.flex')).toBeInTheDocument();
    expect(screen.queryAllByRole('img')).toHaveLength(0);
  });

  it('applies custom className', () => {
    const { container } = render(
      <AvatarStack users={mockUsers.slice(0, 2)} className="custom-class" />,
    );

    const wrapper = container.querySelector('.custom-class');
    expect(wrapper).toBeInTheDocument();
  });

  it('renders all users when count is less than max', () => {
    const threeUsers = mockUsers.slice(0, 3);
    render(<AvatarStack users={threeUsers} max={5} />);

    const avatars = screen.getAllByRole('img');
    expect(avatars).toHaveLength(3);
  });

  it('uses display_name for avatar alt text', () => {
    render(<AvatarStack users={mockUsers.slice(0, 2)} />);

    expect(screen.getByAltText('Alice')).toBeInTheDocument();
    expect(screen.getByAltText('Bob')).toBeInTheDocument();
  });

  it('shows initials when users have no avatar_url', () => {
    render(<AvatarStack users={mockUsersWithInitials} max={3} />);

    // Users without avatar_url show initials instead of images
    expect(screen.getByText('A')).toBeInTheDocument(); // Alice
    expect(screen.getByText('B')).toBeInTheDocument(); // Bob
    expect(screen.getByText('C')).toBeInTheDocument(); // Charlie
  });
});
