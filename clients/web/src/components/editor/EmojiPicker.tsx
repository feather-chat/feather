import { EmojiGrid, type EmojiSelectAttrs } from '../ui';
import type { CustomEmoji } from '@feather/api-client';

interface EmojiPickerProps {
  onSelect: (emoji: string, attrs?: EmojiSelectAttrs) => void;
  customEmojis?: CustomEmoji[];
  onAddEmoji?: () => void;
}

export function EmojiPicker({ onSelect, customEmojis, onAddEmoji }: EmojiPickerProps) {
  return (
    <EmojiGrid onSelect={onSelect} autoFocus customEmojis={customEmojis} onAddEmoji={onAddEmoji} />
  );
}
