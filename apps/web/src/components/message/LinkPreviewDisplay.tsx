import { useState } from 'react';
import type { LinkPreview } from '@enzyme/api-client';

interface LinkPreviewDisplayProps {
  preview: LinkPreview;
}

export function LinkPreviewDisplay({ preview }: LinkPreviewDisplayProps) {
  const [imageError, setImageError] = useState(false);

  if (!preview.title && !preview.description) return null;

  const showImage = preview.image_url && !imageError;

  return (
    <a
      href={preview.url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 flex max-w-lg overflow-hidden rounded-lg border border-gray-200 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/50"
    >
      {showImage && (
        <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center bg-gray-100 dark:bg-gray-800">
          <img
            src={preview.image_url}
            alt=""
            className="h-full w-full object-cover"
            onError={() => setImageError(true)}
          />
        </div>
      )}
      <div className="min-w-0 flex-1 px-3 py-2">
        {preview.site_name && (
          <p className="truncate text-xs font-medium text-blue-600 dark:text-blue-400">
            {preview.site_name}
          </p>
        )}
        {preview.title && (
          <p className="line-clamp-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
            {preview.title}
          </p>
        )}
        {preview.description && (
          <p className="mt-0.5 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
            {preview.description}
          </p>
        )}
      </div>
    </a>
  );
}
