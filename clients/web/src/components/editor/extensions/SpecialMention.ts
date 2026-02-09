import { Node, mergeAttributes } from '@tiptap/core';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';

export interface SpecialMentionOptions {
  HTMLAttributes: Record<string, unknown>;
  renderLabel: (props: { options: SpecialMentionOptions; node: ProseMirrorNode }) => string;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    specialMention: {
      /**
       * Insert a special mention (@here, @channel, @everyone)
       */
      insertSpecialMention: (attrs: { id: string }) => ReturnType;
    };
  }
}

export const SpecialMention = Node.create<SpecialMentionOptions>({
  name: 'specialMention',

  group: 'inline',

  inline: true,

  selectable: false,

  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
      renderLabel({ node }) {
        return `@${node.attrs.id}`;
      },
    };
  },

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-id'),
        renderHTML: (attributes) => {
          if (!attributes.id) {
            return {};
          }
          return { 'data-id': attributes.id };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="special-mention"]',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(
        { 'data-type': 'special-mention' },
        this.options.HTMLAttributes,
        HTMLAttributes,
        {
          class: 'mention special-mention',
        },
      ),
      this.options.renderLabel({ options: this.options, node }),
    ];
  },

  renderText({ node }) {
    return this.options.renderLabel({ options: this.options, node });
  },

  addCommands() {
    return {
      insertSpecialMention:
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
