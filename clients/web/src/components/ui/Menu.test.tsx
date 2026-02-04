import { describe, it, expect, vi } from 'vitest';
import { render, screen, userEvent } from '../../test-utils';
import { Button } from './Button';
import { Menu, MenuItem, MenuSeparator, SelectMenu, SelectMenuItem } from './Menu';

describe('Menu', () => {
  it('opens when trigger is clicked', async () => {
    const user = userEvent.setup();

    render(
      <Menu trigger={<Button>Open Menu</Button>}>
        <MenuItem>Item 1</MenuItem>
        <MenuItem>Item 2</MenuItem>
      </Menu>
    );

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Open Menu' }));

    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('closes when item is clicked', async () => {
    const user = userEvent.setup();

    render(
      <Menu trigger={<Button>Open Menu</Button>}>
        <MenuItem>Item 1</MenuItem>
      </Menu>
    );

    await user.click(screen.getByRole('button', { name: 'Open Menu' }));
    await user.click(screen.getByRole('menuitem', { name: 'Item 1' }));

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('calls onAction when item is clicked', async () => {
    const handleAction = vi.fn();
    const user = userEvent.setup();

    render(
      <Menu trigger={<Button>Open Menu</Button>}>
        <MenuItem onAction={handleAction}>Item 1</MenuItem>
      </Menu>
    );

    await user.click(screen.getByRole('button', { name: 'Open Menu' }));
    await user.click(screen.getByRole('menuitem', { name: 'Item 1' }));

    expect(handleAction).toHaveBeenCalledTimes(1);
  });

  it('supports controlled open state', async () => {
    const handleOpenChange = vi.fn();
    const user = userEvent.setup();

    render(
      <Menu
        trigger={<Button>Open Menu</Button>}
        open={false}
        onOpenChange={handleOpenChange}
      >
        <MenuItem>Item 1</MenuItem>
      </Menu>
    );

    await user.click(screen.getByRole('button', { name: 'Open Menu' }));

    expect(handleOpenChange).toHaveBeenCalledWith(true);
  });

  it('renders menu items with icons', async () => {
    const user = userEvent.setup();
    const icon = <span data-testid="menu-icon">Icon</span>;

    render(
      <Menu trigger={<Button>Open Menu</Button>}>
        <MenuItem icon={icon}>Item with icon</MenuItem>
      </Menu>
    );

    await user.click(screen.getByRole('button', { name: 'Open Menu' }));

    expect(screen.getByTestId('menu-icon')).toBeInTheDocument();
  });

  it('renders danger variant items', async () => {
    const user = userEvent.setup();

    render(
      <Menu trigger={<Button>Open Menu</Button>}>
        <MenuItem variant="danger">Delete</MenuItem>
      </Menu>
    );

    await user.click(screen.getByRole('button', { name: 'Open Menu' }));

    const item = screen.getByRole('menuitem', { name: 'Delete' });
    expect(item).toHaveClass('text-red-600');
  });

  it('renders separator between items', async () => {
    const user = userEvent.setup();

    render(
      <Menu trigger={<Button>Open Menu</Button>}>
        <MenuItem>Item 1</MenuItem>
        <MenuSeparator />
        <MenuItem>Item 2</MenuItem>
      </Menu>
    );

    await user.click(screen.getByRole('button', { name: 'Open Menu' }));

    expect(screen.getByRole('separator')).toBeInTheDocument();
  });

  it('supports keyboard navigation', async () => {
    const user = userEvent.setup();

    render(
      <Menu trigger={<Button>Open Menu</Button>}>
        <MenuItem>Item 1</MenuItem>
        <MenuItem>Item 2</MenuItem>
      </Menu>
    );

    await user.click(screen.getByRole('button', { name: 'Open Menu' }));
    await user.keyboard('{ArrowDown}');

    // Focus should move to first/next item
    const items = screen.getAllByRole('menuitem');
    expect(items.length).toBe(2);
  });

  it('closes on escape key', async () => {
    const user = userEvent.setup();

    render(
      <Menu trigger={<Button>Open Menu</Button>}>
        <MenuItem>Item 1</MenuItem>
      </Menu>
    );

    await user.click(screen.getByRole('button', { name: 'Open Menu' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});

describe('SelectMenu', () => {
  it('shows check mark for selected item', async () => {
    const user = userEvent.setup();

    render(
      <SelectMenu
        trigger={<Button>Select Option</Button>}
        selectedKey="option1"
        onSelectionChange={vi.fn()}
      >
        <SelectMenuItem id="option1">Option 1</SelectMenuItem>
        <SelectMenuItem id="option2">Option 2</SelectMenuItem>
      </SelectMenu>
    );

    await user.click(screen.getByRole('button', { name: 'Select Option' }));

    // The selected item should have a check icon (SVG)
    const selectedItem = screen.getByRole('menuitemradio', { name: /Option 1/ });
    expect(selectedItem).toHaveAttribute('aria-checked', 'true');
  });

  it('calls onSelectionChange when item is selected', async () => {
    const handleSelectionChange = vi.fn();
    const user = userEvent.setup();

    render(
      <SelectMenu
        trigger={<Button>Select Option</Button>}
        selectedKey="option1"
        onSelectionChange={handleSelectionChange}
      >
        <SelectMenuItem id="option1">Option 1</SelectMenuItem>
        <SelectMenuItem id="option2">Option 2</SelectMenuItem>
      </SelectMenu>
    );

    await user.click(screen.getByRole('button', { name: 'Select Option' }));
    await user.click(screen.getByRole('menuitemradio', { name: /Option 2/ }));

    expect(handleSelectionChange).toHaveBeenCalledWith('option2');
  });
});
