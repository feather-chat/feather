import { describe, it, expect, vi } from 'vitest';
import { render, screen, userEvent } from '../../test-utils';
import { Modal } from './Modal';

describe('Modal', () => {
  it('renders children when open', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()}>
        <p>Modal content</p>
      </Modal>
    );

    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('does not render content when closed', () => {
    render(
      <Modal isOpen={false} onClose={vi.fn()}>
        <p>Modal content</p>
      </Modal>
    );

    expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
  });

  it('renders title when provided', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Test Title">
        <p>Content</p>
      </Modal>
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('does not render header when title not provided', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()}>
        <p>Content</p>
      </Modal>
    );

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();

    render(
      <Modal isOpen={true} onClose={handleClose} title="Test">
        <p>Content</p>
      </Modal>
    );

    await user.click(screen.getByRole('button', { name: 'Close' }));

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when escape key is pressed', async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();

    render(
      <Modal isOpen={true} onClose={handleClose} title="Test">
        <p>Content</p>
      </Modal>
    );

    await user.keyboard('{Escape}');

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when overlay is clicked', async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();

    render(
      <Modal isOpen={true} onClose={handleClose} title="Test">
        <p>Content</p>
      </Modal>
    );

    // The overlay is the ModalOverlay element with the backdrop
    const overlay = document.querySelector('[data-testid="modal-overlay"]') ||
      screen.getByRole('dialog').parentElement?.parentElement;

    if (overlay) {
      // Click outside the dialog content (on the overlay)
      await user.click(overlay);
      expect(handleClose).toHaveBeenCalled();
    }
  });

  it('renders with small size', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} size="sm" title="Small Modal">
        <p>Content</p>
      </Modal>
    );

    // The size class is on the AriaModal container, parent of the dialog
    const dialog = screen.getByRole('dialog');
    expect(dialog.parentElement).toHaveClass('max-w-sm');
  });

  it('renders with medium size (default)', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Medium Modal">
        <p>Content</p>
      </Modal>
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog.parentElement).toHaveClass('max-w-md');
  });

  it('renders with large size', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} size="lg" title="Large Modal">
        <p>Content</p>
      </Modal>
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog.parentElement).toHaveClass('max-w-lg');
  });

  it('has accessible dialog role', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Accessible Modal">
        <p>Content</p>
      </Modal>
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
