import { Node, mergeAttributes } from '@tiptap/core';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';

export interface ChannelMentionOptions {
  HTMLAttributes: Record<string, unknown>;
  renderLabel: (props: { options: ChannelMentionOptions; node: ProseMirrorNode }) => string;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    channelMention: {
      /**
       * Insert a channel mention
       */
      insertChannelMention: (attrs: { id: string; label: string }) => ReturnType;
    };
  }
}

export const ChannelMention = Node.create<ChannelMentionOptions>({
  name: 'channelMention',

  group: 'inline',

  inline: true,

  selectable: false,

  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
      renderLabel({ node }) {
        return `#${node.attrs.label}`;
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
        tag: 'span[data-type="channel-mention"]',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(
        { 'data-type': 'channel-mention' },
        this.options.HTMLAttributes,
        HTMLAttributes,
        {
          class: 'mention channel-mention',
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
      insertChannelMention:
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
