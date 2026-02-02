import type { Editor } from '@tiptap/react';
import { ToggleButton } from 'react-aria-components';
import { tv } from 'tailwind-variants';
import {
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  StrikethroughIcon,
  CodeBracketIcon,
  CodeBracketSquareIcon,
  LinkIcon,
  ListBulletIcon,
  NumberedListIcon,
} from '@heroicons/react/24/outline';

function BlockquoteIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      fill="none"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 4v16m4.5-14h12m-12 6h12m-12 6h8.25"
      />
    </svg>
  );
}

const toolbar = tv({
  slots: {
    container: [
      'flex items-center gap-0.5 px-2 py-1',
      'bg-gray-50 dark:bg-gray-800/50',
      'rounded-t-lg',
    ],
    button: [
      'p-1.5 rounded transition-colors text-gray-500 dark:text-gray-400',
      'hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200',
      'data-[selected=true]:bg-gray-200 dark:data-[selected=true]:bg-gray-600',
      'data-[selected=true]:text-gray-900 dark:data-[selected=true]:text-white',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
      'disabled:opacity-50 disabled:cursor-not-allowed',
    ],
    separator: [
      'w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1',
    ],
    icon: 'w-4 h-4',
  },
});

interface ToolbarProps {
  editor: Editor | null;
}

export function Toolbar({ editor }: ToolbarProps) {
  const s = toolbar();

  if (!editor) {
    return null;
  }

  const addLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className={s.container()}>
      {/* Text formatting */}
      <ToggleButton
        isSelected={editor.isActive('bold')}
        onChange={() => editor.chain().focus().toggleBold().run()}
        className={s.button()}
        aria-label="Bold (Cmd+B)"
      >
        <BoldIcon className={s.icon()} />
      </ToggleButton>

      <ToggleButton
        isSelected={editor.isActive('italic')}
        onChange={() => editor.chain().focus().toggleItalic().run()}
        className={s.button()}
        aria-label="Italic (Cmd+I)"
      >
        <ItalicIcon className={s.icon()} />
      </ToggleButton>

      <ToggleButton
        isSelected={editor.isActive('strike')}
        onChange={() => editor.chain().focus().toggleStrike().run()}
        className={s.button()}
        aria-label="Strikethrough (Cmd+Shift+X)"
      >
        <StrikethroughIcon className={s.icon()} />
      </ToggleButton>

      <ToggleButton
        isSelected={editor.isActive('underline')}
        onChange={() => editor.chain().focus().toggleUnderline().run()}
        className={s.button()}
        aria-label="Underline (Cmd+U)"
      >
        <UnderlineIcon className={s.icon()} />
      </ToggleButton>

      <div className={s.separator()} />

      {/* Code */}
      <ToggleButton
        isSelected={editor.isActive('code')}
        onChange={() => editor.chain().focus().toggleCode().run()}
        className={s.button()}
        aria-label="Inline code (Cmd+E)"
      >
        <CodeBracketIcon className={s.icon()} />
      </ToggleButton>

      <ToggleButton
        isSelected={editor.isActive('codeBlock')}
        onChange={() => editor.chain().focus().toggleCodeBlock().run()}
        className={s.button()}
        aria-label="Code block"
      >
        <CodeBracketSquareIcon className={s.icon()} />
      </ToggleButton>

      <div className={s.separator()} />

      {/* Block formatting */}
      <ToggleButton
        isSelected={editor.isActive('blockquote')}
        onChange={() => editor.chain().focus().toggleBlockquote().run()}
        className={s.button()}
        aria-label="Blockquote"
      >
        <BlockquoteIcon className={s.icon()} />
      </ToggleButton>

      <ToggleButton
        isSelected={editor.isActive('bulletList')}
        onChange={() => editor.chain().focus().toggleBulletList().run()}
        className={s.button()}
        aria-label="Bullet list"
      >
        <ListBulletIcon className={s.icon()} />
      </ToggleButton>

      <ToggleButton
        isSelected={editor.isActive('orderedList')}
        onChange={() => editor.chain().focus().toggleOrderedList().run()}
        className={s.button()}
        aria-label="Numbered list"
      >
        <NumberedListIcon className={s.icon()} />
      </ToggleButton>

      <div className={s.separator()} />

      {/* Link */}
      <ToggleButton
        isSelected={editor.isActive('link')}
        onChange={addLink}
        className={s.button()}
        aria-label="Insert link"
      >
        <LinkIcon className={s.icon()} />
      </ToggleButton>
    </div>
  );
}
