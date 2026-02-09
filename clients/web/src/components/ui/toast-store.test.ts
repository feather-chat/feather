import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toast, toastQueue, type ToastContent } from './toast-store';

describe('toast-store', () => {
  beforeEach(() => {
    // Clear any existing toasts
    vi.clearAllMocks();
  });

  describe('toastQueue', () => {
    it('is a ToastQueue instance', () => {
      expect(toastQueue).toBeDefined();
      expect(typeof toastQueue.add).toBe('function');
    });
  });

  describe('toast', () => {
    it('adds toast with default info type', () => {
      const addSpy = vi.spyOn(toastQueue, 'add');

      toast('Test message');

      expect(addSpy).toHaveBeenCalledWith(
        { message: 'Test message', type: 'info' },
        { timeout: 5000 },
      );
    });

    it('adds toast with success type', () => {
      const addSpy = vi.spyOn(toastQueue, 'add');

      toast('Success!', 'success');

      expect(addSpy).toHaveBeenCalledWith(
        { message: 'Success!', type: 'success' },
        { timeout: 5000 },
      );
    });

    it('adds toast with error type', () => {
      const addSpy = vi.spyOn(toastQueue, 'add');

      toast('Error occurred', 'error');

      expect(addSpy).toHaveBeenCalledWith(
        { message: 'Error occurred', type: 'error' },
        { timeout: 5000 },
      );
    });

    it('adds toast with info type explicitly', () => {
      const addSpy = vi.spyOn(toastQueue, 'add');

      toast('Information', 'info');

      expect(addSpy).toHaveBeenCalledWith(
        { message: 'Information', type: 'info' },
        { timeout: 5000 },
      );
    });

    it('uses 5000ms timeout', () => {
      const addSpy = vi.spyOn(toastQueue, 'add');

      toast('Test');

      expect(addSpy).toHaveBeenCalledWith(expect.any(Object), { timeout: 5000 });
    });
  });

  describe('ToastContent type', () => {
    it('accepts valid toast content', () => {
      const successToast: ToastContent = { message: 'Success', type: 'success' };
      const errorToast: ToastContent = { message: 'Error', type: 'error' };
      const infoToast: ToastContent = { message: 'Info', type: 'info' };

      expect(successToast.type).toBe('success');
      expect(errorToast.type).toBe('error');
      expect(infoToast.type).toBe('info');
    });
  });
});
