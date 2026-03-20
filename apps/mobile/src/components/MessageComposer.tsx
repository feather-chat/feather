import { useCallback, useRef, useState } from 'react';
import { View, TextInput, Pressable, Text, ScrollView } from 'react-native';
import {
  useSendMessage,
  useSendThreadReply,
  useUpdateMessage,
  useEditingMessageId,
  clearEditingMessageId,
  useMessage,
} from '@enzyme/shared';
import { MentionSuggestions } from './MentionSuggestions';

const MAX_LENGTH = 40000;
const WARN_THRESHOLD = 39000;

interface MessageComposerProps {
  channelId: string;
  workspaceId: string;
  threadParentId?: string;
  alsoSendToChannel?: boolean;
}

type FormatAction = {
  label: string;
  prefix: string;
  suffix: string;
};

const FORMAT_ACTIONS: FormatAction[] = [
  { label: 'B', prefix: '*', suffix: '*' },
  { label: 'I', prefix: '_', suffix: '_' },
  { label: 'S', prefix: '~', suffix: '~' },
  { label: '<>', prefix: '`', suffix: '`' },
  { label: '>', prefix: '> ', suffix: '' },
  { label: '•', prefix: '• ', suffix: '' },
];

export function MessageComposer({
  channelId,
  workspaceId,
  threadParentId,
  alsoSendToChannel,
}: MessageComposerProps) {
  const [text, setText] = useState('');
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const inputRef = useRef<TextInput>(null);

  const editingMessageId = useEditingMessageId();
  const { data: editingMessage } = useMessage(editingMessageId ?? undefined);

  const sendMessage = useSendMessage(channelId);
  const sendThreadReply = useSendThreadReply(threadParentId ?? '', channelId);
  const updateMessage = useUpdateMessage();

  // Load editing message content
  const [editLoaded, setEditLoaded] = useState<string | null>(null);
  if (editingMessageId && editingMessage?.message && editLoaded !== editingMessageId) {
    setText(editingMessage.message.content);
    setEditLoaded(editingMessageId);
  }

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;

    if (editingMessageId) {
      updateMessage.mutate(
        { messageId: editingMessageId, content: trimmed },
        {
          onSuccess: () => {
            setText('');
            setEditLoaded(null);
            clearEditingMessageId();
          },
        },
      );
    } else if (threadParentId) {
      sendThreadReply.mutate(
        { content: trimmed, also_send_to_channel: alsoSendToChannel },
        { onSuccess: () => setText('') },
      );
    } else {
      sendMessage.mutate({ content: trimmed }, { onSuccess: () => setText('') });
    }
  }, [
    text,
    editingMessageId,
    threadParentId,
    alsoSendToChannel,
    updateMessage,
    sendThreadReply,
    sendMessage,
  ]);

  const handleCancelEdit = useCallback(() => {
    clearEditingMessageId();
    setText('');
    setEditLoaded(null);
  }, []);

  const applyFormat = useCallback(
    (action: FormatAction) => {
      const { start, end } = selection;
      const before = text.slice(0, start);
      const selected = text.slice(start, end);
      const after = text.slice(end);
      const newText = `${before}${action.prefix}${selected}${action.suffix}${after}`;
      setText(newText);
    },
    [text, selection],
  );

  const handleMentionSelect = useCallback(
    (token: string) => {
      // Find the trigger position
      const beforeCursor = text.slice(0, selection.start);
      const triggerIndex = Math.max(
        beforeCursor.lastIndexOf('@'),
        beforeCursor.lastIndexOf('#'),
        beforeCursor.lastIndexOf(':'),
      );
      if (triggerIndex === -1) return;

      const before = text.slice(0, triggerIndex);
      const after = text.slice(selection.start);
      const newText = `${before}${token} ${after}`;
      setText(newText);
      const newPos = before.length + token.length + 1;
      setSelection({ start: newPos, end: newPos });
    },
    [text, selection],
  );

  const isSending = sendMessage.isPending || sendThreadReply.isPending || updateMessage.isPending;
  const canSend = text.trim().length > 0 && !isSending;
  const showCharCount = text.length > WARN_THRESHOLD;

  return (
    <View>
      <MentionSuggestions
        text={text}
        cursorPosition={selection.start}
        workspaceId={workspaceId}
        onSelect={handleMentionSelect}
      />

      {editingMessageId && (
        <View className="flex-row items-center justify-between border-t border-neutral-200 bg-yellow-50 px-4 py-2 dark:border-neutral-700 dark:bg-yellow-900/20">
          <Text className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
            Editing message
          </Text>
          <Pressable onPress={handleCancelEdit}>
            <Text className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
              Cancel
            </Text>
          </Pressable>
        </View>
      )}

      {/* Formatting toolbar */}
      <View className="border-t border-neutral-200 dark:border-neutral-700">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 8 }}
          className="border-b border-neutral-100 py-1 dark:border-neutral-800"
        >
          {FORMAT_ACTIONS.map((action) => (
            <Pressable
              key={action.label}
              className="mx-0.5 rounded px-3 py-1 active:bg-neutral-200 dark:active:bg-neutral-700"
              onPress={() => applyFormat(action)}
            >
              <Text className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                {action.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View className="flex-row items-end px-3 py-2">
          <TextInput
            ref={inputRef}
            className="max-h-32 min-h-9 flex-1 rounded-xl bg-neutral-100 px-3 py-2 text-base text-neutral-900 dark:bg-neutral-800 dark:text-white"
            placeholder={editingMessageId ? 'Edit message...' : 'Message...'}
            placeholderTextColor="#9ca3af"
            multiline
            value={text}
            onChangeText={setText}
            onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
            maxLength={MAX_LENGTH}
          />
          <Pressable
            className={`ml-2 h-9 w-9 items-center justify-center rounded-full ${canSend ? 'bg-blue-500' : 'bg-neutral-300 dark:bg-neutral-700'}`}
            onPress={handleSend}
            disabled={!canSend}
          >
            <Text className="text-base font-bold text-white">↑</Text>
          </Pressable>
        </View>

        {showCharCount && (
          <Text className="px-4 pb-1 text-xs text-neutral-400">
            {text.length.toLocaleString()}/{MAX_LENGTH.toLocaleString()}
          </Text>
        )}
      </View>
    </View>
  );
}
