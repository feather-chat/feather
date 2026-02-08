import type { JSONContent } from '@tiptap/react';

/**
 * Convert TipTap JSON content to mrkdwn string format.
 *
 * mrkdwn format:
 * - *bold* for bold text
 * - _italic_ for italic text
 * - ++underline++ for underlined text
 * - ~strikethrough~ for strikethrough
 * - `code` for inline code
 * - ```code``` for code blocks
 * - > for blockquotes
 * - <@userId> for user mentions
 * - <!here>, <!channel>, <!everyone> for special mentions
 * - <url|text> for links
 */
export function toMrkdwn(content: JSONContent): string {
  if (!content) return '';
  return serializeNode(content).trim();
}

function serializeNode(node: JSONContent): string {
  if (!node.type) return '';

  switch (node.type) {
    case 'doc':
      return serializeChildren(node);

    case 'paragraph':
      return serializeChildren(node) + '\n';

    case 'text':
      return serializeText(node);

    case 'hardBreak':
      return '\n';

    case 'heading': {
      // Convert headings to bold text
      const level = node.attrs?.level || 1;
      const text = serializeChildren(node);
      return '*'.repeat(Math.min(level, 3)) + text + '*'.repeat(Math.min(level, 3)) + '\n';
    }

    case 'bulletList':
      return serializeBulletList(node);

    case 'orderedList':
      return serializeOrderedList(node);

    case 'listItem':
      return serializeChildren(node);

    case 'blockquote':
      return serializeBlockquote(node);

    case 'codeBlock': {
      let code = serializeChildren(node);
      const lang = node.attrs?.language || '';
      // Ensure code ends with newline so closing ``` is on its own line
      if (code && !code.endsWith('\n')) {
        code += '\n';
      }
      return '```' + lang + '\n' + code + '```\n';
    }

    case 'horizontalRule':
      return '---\n';

    case 'userMention':
      return `<@${node.attrs?.id}>`;

    case 'specialMention':
      return `<!${node.attrs?.id}>`;

    case 'channelMention':
      return `<#${node.attrs?.id}>`;

    case 'emojiNode':
      return `:${node.attrs?.shortcode}:`;

    default:
      // For unknown nodes, try to serialize children
      return serializeChildren(node);
  }
}

function serializeChildren(node: JSONContent): string {
  if (!node.content) return '';
  return node.content.map(serializeNode).join('');
}

function serializeText(node: JSONContent): string {
  let text = node.text || '';
  const marks = node.marks || [];

  // Apply marks in order (inner to outer)
  for (const mark of marks) {
    switch (mark.type) {
      case 'bold':
        text = `*${text}*`;
        break;
      case 'italic':
        text = `_${text}_`;
        break;
      case 'underline':
        text = `++${text}++`;
        break;
      case 'strike':
        text = `~${text}~`;
        break;
      case 'code':
        text = `\`${text}\``;
        break;
      case 'link':
        text = mark.attrs?.href
          ? `<${mark.attrs.href}|${text}>`
          : text;
        break;
    }
  }

  return text;
}

function serializeBulletList(node: JSONContent): string {
  if (!node.content) return '';
  return node.content.map((item) => {
    const content = serializeListItem(item);
    return `• ${content}`;
  }).join('');
}

function serializeOrderedList(node: JSONContent): string {
  if (!node.content) return '';
  return node.content.map((item, index) => {
    const content = serializeListItem(item);
    return `${index + 1}. ${content}`;
  }).join('');
}

function serializeListItem(node: JSONContent): string {
  if (!node.content) return '\n';

  // List items contain paragraphs, we need to handle them specially
  const parts: string[] = [];
  for (const child of node.content) {
    if (child.type === 'paragraph') {
      parts.push(serializeChildren(child));
    } else {
      parts.push(serializeNode(child));
    }
  }
  return parts.join('') + '\n';
}

function serializeBlockquote(node: JSONContent): string {
  if (!node.content) return '';

  const content = node.content.map((child) => {
    const text = serializeNode(child);
    // Prefix each line with >
    return text.split('\n').map(line => line ? `> ${line}` : '>').join('\n');
  }).join('');

  return content + '\n';
}
