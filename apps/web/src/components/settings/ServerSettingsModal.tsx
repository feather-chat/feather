import { Modal } from '../ui';

interface ServerSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ServerSettingsModal({ isOpen, onClose }: ServerSettingsModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Server Settings" size="lg">
      <div className="rounded-lg bg-gray-50 dark:bg-gray-900">
        <div className="border-b border-gray-200 p-6 dark:border-gray-700">
          <h2 className="mb-1 text-lg font-medium text-gray-900 dark:text-white">
            Server Information
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            General information about your Enzyme server.
          </p>
        </div>

        <div className="space-y-4 p-6">
          <div className="flex items-center justify-between border-b border-gray-100 py-3 dark:border-gray-700">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Version</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Enzyme server version</p>
            </div>
            <span className="text-gray-600 dark:text-gray-300">1.0.0</span>
          </div>

          <div className="flex items-center justify-between border-b border-gray-100 py-3 dark:border-gray-700">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Database</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Database backend</p>
            </div>
            <span className="text-gray-600 dark:text-gray-300">SQLite</span>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Email</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Email service status</p>
            </div>
            <span className="text-yellow-600 dark:text-yellow-400">Not configured</span>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-lg bg-gray-50 dark:bg-gray-900">
        <div className="border-b border-gray-200 p-6 dark:border-gray-700">
          <h2 className="mb-1 text-lg font-medium text-gray-900 dark:text-white">Administration</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Server administration options.</p>
        </div>

        <div className="p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Server configuration is managed through environment variables and the config file. See
            the documentation for more details.
          </p>
        </div>
      </div>
    </Modal>
  );
}
