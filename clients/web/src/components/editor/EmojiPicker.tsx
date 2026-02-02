import { useState } from 'react';
import { tv } from 'tailwind-variants';
import { COMMON_EMOJIS, searchEmojis } from '../../lib/emoji';

const styles = tv({
  slots: {
    container: [
      'bg-white dark:bg-gray-800',
      'border border-gray-200 dark:border-gray-700',
      'rounded-lg shadow-lg p-2 w-64',
    ],
    searchInput: [
      'w-full px-2 py-1.5 text-sm',
      'border border-gray-200 dark:border-gray-700 rounded',
      'bg-white dark:bg-gray-900',
      'text-gray-900 dark:text-white',
      'placeholder-gray-400 dark:placeholder-gray-500',
      'focus:outline-none focus:ring-2 focus:ring-primary-500',
      'mb-2',
    ],
    grid: 'grid grid-cols-8 gap-0.5',
    emojiButton: [
      'w-7 h-7 flex items-center justify-center rounded',
      'hover:bg-gray-100 dark:hover:bg-gray-700',
      'text-lg transition-colors cursor-pointer',
    ],
    section: 'mb-2',
    sectionTitle: [
      'text-xs font-medium text-gray-500 dark:text-gray-400',
      'uppercase tracking-wide mb-1 px-1',
    ],
    searchResults: 'space-y-0.5',
    searchResultItem: [
      'w-full flex items-center gap-2 px-2 py-1 rounded',
      'hover:bg-gray-100 dark:hover:bg-gray-700',
      'text-left cursor-pointer transition-colors',
    ],
    searchResultEmoji: 'text-lg',
    searchResultShortcode: 'text-sm text-gray-600 dark:text-gray-400',
    noResults: 'text-sm text-gray-500 dark:text-gray-400 text-center py-4',
  },
});

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
}

export function EmojiPicker({ onSelect }: EmojiPickerProps) {
  const [search, setSearch] = useState('');
  const s = styles();

  const searchResults = search ? searchEmojis(search, 16) : [];
  const showSearch = search.length > 0;

  return (
    <div className={s.container()}>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search emoji..."
        className={s.searchInput()}
        autoFocus
      />

      {showSearch ? (
        searchResults.length > 0 ? (
          <div className={s.searchResults()}>
            {searchResults.map(({ shortcode, emoji }) => (
              <button
                key={shortcode}
                type="button"
                onClick={() => onSelect(emoji)}
                className={s.searchResultItem()}
              >
                <span className={s.searchResultEmoji()}>{emoji}</span>
                <span className={s.searchResultShortcode()}>:{shortcode}:</span>
              </button>
            ))}
          </div>
        ) : (
          <div className={s.noResults()}>No emoji found</div>
        )
      ) : (
        <div className={s.section()}>
          <div className={s.sectionTitle()}>Frequently used</div>
          <div className={s.grid()}>
            {COMMON_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => onSelect(emoji)}
                className={s.emojiButton()}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
