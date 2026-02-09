import { Node, mergeAttributes } from '@tiptap/core';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';

export interface UserMentionOptions {
  HTMLAttributes: Record<string, unknown>;
  renderLabel: (props: { options: UserMentionOptions; node: ProseMirrorNode }) => string;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    userMention: {
      /**
       * Insert a user mention
       */
      insertUserMention: (attrs: { id: string; label: string }) => ReturnType;
    };
  }
}

export const UserMention = Node.create<UserMentionOptions>({
  name: 'userMention',

  group: 'inline',

  inline: true,

  selectable: false,

  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
      renderLabel({ node }) {
        return `@${node.attrs.label}`;
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
      label: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-label'),
        renderHTML: (attributes) => {
          if (!attributes.label) {
            return {};
          }
          return { 'data-label': attributes.label };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="user-mention"]',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(
        { 'data-type': 'user-mention' },
        this.options.HTMLAttributes,
        HTMLAttributes,
        {
          class: 'mention user-mention',
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
      insertUserMention:
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
