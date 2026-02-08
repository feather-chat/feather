import { Node, mergeAttributes } from '@tiptap/core';

export interface EmojiNodeOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    emojiNode: {
      insertEmoji: (attrs: {
        shortcode: string;
        unicode?: string;
        imageUrl?: string;
      }) => ReturnType;
    };
  }
}

export const EmojiNode = Node.create<EmojiNodeOptions>({
  name: 'emojiNode',

  group: 'inline',

  inline: true,

  selectable: true,

  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      shortcode: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-shortcode'),
        renderHTML: (attributes) => {
          if (!attributes.shortcode) return {};
          return { 'data-shortcode': attributes.shortcode };
        },
      },
      unicode: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-unicode'),
        renderHTML: (attributes) => {
          if (!attributes.unicode) return {};
          return { 'data-unicode': attributes.unicode };
        },
      },
      imageUrl: {
        default: null,
        parseHTML: (element) => element.getAttribute('src') || element.getAttribute('data-image-url'),
        renderHTML: (attributes) => {
          if (!attributes.imageUrl) return {};
          return { 'data-image-url': attributes.imageUrl };
        },
      },
    };
  },

  parseHTML() {
    return [
      { tag: 'span[data-type="emoji"]' },
      { tag: 'img[data-type="emoji"]' },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    // Custom emoji — render as <img>
    if (node.attrs.imageUrl) {
      return [
        'img',
        mergeAttributes(
          {
            'data-type': 'emoji',
            src: node.attrs.imageUrl,
            alt: `:${node.attrs.shortcode}:`,
            title: `:${node.attrs.shortcode}:`,
            draggable: 'false',
          },
          this.options.HTMLAttributes,
          HTMLAttributes,
          { class: 'emoji-custom' },
        ),
      ];
    }

    // Standard emoji — render as <span> with unicode character
    return [
      'span',
      mergeAttributes(
        { 'data-type': 'emoji' },
        this.options.HTMLAttributes,
        HTMLAttributes,
        { class: 'emoji-node' },
      ),
      node.attrs.unicode || `:${node.attrs.shortcode}:`,
    ];
  },

  renderText({ node }) {
    return `:${node.attrs.shortcode}:`;
  },

  addCommands() {
    return {
      insertEmoji:
        (attrs) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs,
          });
        },
    };
  },
});
