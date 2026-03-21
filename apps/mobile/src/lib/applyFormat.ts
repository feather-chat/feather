export interface FormatAction {
  label: string;
  prefix: string;
  suffix: string;
}

export const FORMAT_ACTIONS: FormatAction[] = [
  { label: 'B', prefix: '*', suffix: '*' },
  { label: 'I', prefix: '_', suffix: '_' },
  { label: 'S', prefix: '~', suffix: '~' },
  { label: '<>', prefix: '`', suffix: '`' },
  { label: '>', prefix: '> ', suffix: '' },
  { label: '•', prefix: '• ', suffix: '' },
];

export function applyFormat(
  text: string,
  selection: { start: number; end: number },
  action: FormatAction,
): string {
  const before = text.slice(0, selection.start);
  const selected = text.slice(selection.start, selection.end);
  const after = text.slice(selection.end);
  return `${before}${action.prefix}${selected}${action.suffix}${after}`;
}

export function insertMentionToken(
  text: string,
  cursorPosition: number,
  token: string,
): { newText: string; newPosition: number } | null {
  const beforeCursor = text.slice(0, cursorPosition);
  const triggerIndex = Math.max(
    beforeCursor.lastIndexOf('@'),
    beforeCursor.lastIndexOf('#'),
    beforeCursor.lastIndexOf(':'),
  );
  if (triggerIndex === -1) return null;

  const before = text.slice(0, triggerIndex);
  const after = text.slice(cursorPosition);
  const newText = `${before}${token} ${after}`;
  const newPosition = before.length + token.length + 1;
  return { newText, newPosition };
}
