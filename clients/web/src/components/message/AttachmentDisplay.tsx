import { useState } from 'react';
import { Button as AriaButton, Dialog, DialogTrigger, Heading, Modal as AriaModal, ModalOverlay } from 'react-aria-components';
import type { Attachment } from '@feather/api-client';

interface AttachmentDisplayProps {
  attachments: Attachment[];
}

function isImageType(contentType: string): boolean {
  return contentType.startsWith('image/');
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ImageAttachment({ attachment }: { attachment: Attachment }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <DialogTrigger isOpen={isOpen} onOpenChange={setIsOpen}>
      <AriaButton
        className="block rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors cursor-pointer"
        aria-label={`View ${attachment.filename}`}
      >
        <img
          src={attachment.url}
          alt={attachment.filename}
          className="max-h-64 max-w-full object-contain"
          loading="lazy"
        />
      </AriaButton>
      <ModalOverlay
        className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
        isDismissable
      >
        <AriaModal className="outline-none max-w-[90vw] max-h-[90vh]">
          <Dialog className="outline-none">
            {({ close }) => (
              <div className="relative">
                <img
                  src={attachment.url}
                  alt={attachment.filename}
                  className="max-w-full max-h-[85vh] object-contain rounded-lg"
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  <a
                    href={attachment.url}
                    download={attachment.filename}
                    className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg transition-colors"
                    title="Download"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </a>
                  <button
                    onClick={close}
                    className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg transition-colors"
                    title="Close"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="absolute bottom-2 left-2 right-2 text-center">
                  <Heading
                    slot="title"
                    className="text-white text-sm bg-black/50 px-3 py-1 rounded-lg inline-block"
                  >
                    {attachment.filename}
                  </Heading>
                </div>
              </div>
            )}
          </Dialog>
        </AriaModal>
      </ModalOverlay>
    </DialogTrigger>
  );
}

function FileAttachment({ attachment }: { attachment: Attachment }) {
  return (
    <a
      href={attachment.url}
      download={attachment.filename}
      className="flex items-center gap-3 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors max-w-xs"
    >
      <div className="flex-shrink-0 w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
        <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {attachment.filename}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {formatFileSize(attachment.size_bytes)}
        </p>
      </div>
      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
    </a>
  );
}

export function AttachmentDisplay({ attachments }: AttachmentDisplayProps) {
  if (!attachments || attachments.length === 0) return null;

  const images = attachments.filter((a) => isImageType(a.content_type));
  const files = attachments.filter((a) => !isImageType(a.content_type));

  return (
    <div className="mt-2 space-y-2">
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((attachment) => (
            <ImageAttachment key={attachment.id} attachment={attachment} />
          ))}
        </div>
      )}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((attachment) => (
            <FileAttachment key={attachment.id} attachment={attachment} />
          ))}
        </div>
      )}
    </div>
  );
}
