import { useState, useRef } from 'react';
import { Button, Modal, toast } from '../ui';
import { resolveStandardShortcode } from '../../lib/emoji';
import { useUploadCustomEmoji } from '../../hooks/useCustomEmojis';
import type { CustomEmoji } from '@feather/api-client';

const NAME_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,62}$/;

interface AddEmojiModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  customEmojis: CustomEmoji[];
}

export function AddEmojiModal({ isOpen, onClose, workspaceId, customEmojis }: AddEmojiModalProps) {
  const [name, setName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadEmoji = useUploadCustomEmoji(workspaceId);

  const nameError = (() => {
    if (!name) return null;
    const lower = name.toLowerCase();
    if (!NAME_REGEX.test(name)) {
      return 'Name must start with a letter or number and contain only letters, numbers, hyphens, and underscores (max 63 chars).';
    }
    if (resolveStandardShortcode(lower)) {
      return `":${lower}:" is already a standard emoji. Choose a different name.`;
    }
    if (customEmojis.some((e) => e.name === lower)) {
      return `":${lower}:" already exists in this workspace.`;
    }
    return null;
  })();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast('Only PNG and GIF files are allowed.', 'error');
      return;
    }

    if (file.size > 256 * 1024) {
      toast('File too large. Maximum size is 256KB.', 'error');
      return;
    }

    setSelectedFile(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleClear = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    handleClear();
    onClose();
  };

  const handleSave = async () => {
    if (!selectedFile || !name || nameError) return;
    try {
      await uploadEmoji.mutateAsync({ file: selectedFile, name: name.toLowerCase() });
      toast(`Emoji :${name.toLowerCase()}: added`, 'success');
      handleClose();
    } catch {
      // Error toast is handled by the mutation hook
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Custom Emoji" size="sm">
      <div className="space-y-4">
        {/* Image upload */}
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center justify-center overflow-hidden flex-shrink-0">
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className="max-w-full max-h-full object-contain" />
            ) : (
              <span className="text-gray-400 text-xs">Preview</span>
            )}
          </div>
          <div className="flex-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/gif"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              variant="secondary"
              size="sm"
              onPress={() => fileInputRef.current?.click()}
            >
              {selectedFile ? 'Change Image' : 'Upload Image'}
            </Button>
            {selectedFile && (
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                {selectedFile.name}
              </span>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              PNG or GIF. Max 256KB.
            </p>
          </div>
        </div>

        {/* Name input */}
        <div>
          <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
            Name
          </label>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">:</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.replace(/\s/g, ''))}
              placeholder="emoji_name"
              className="flex-1 px-2 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white placeholder-gray-400"
            />
            <span className="text-gray-400">:</span>
          </div>
          {nameError && (
            <p className="text-xs text-red-500 mt-1">{nameError}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" size="sm" onPress={handleClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            onPress={handleSave}
            isDisabled={!selectedFile || !name || !!nameError}
            isLoading={uploadEmoji.isPending}
          >
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}
