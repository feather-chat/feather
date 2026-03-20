import { Text, View, ScrollView, Linking } from 'react-native';
import {
  parseMrkdwn,
  isEmojiOnly,
  resolveStandardShortcode,
  type MrkdwnSegment,
} from '@enzyme/shared';
import type { WorkspaceMemberWithUser, ChannelWithMembership } from '@enzyme/api-client';

interface MrkdwnRendererProps {
  content: string;
  members?: WorkspaceMemberWithUser[];
  channels?: ChannelWithMembership[];
  onMentionPress?: (userId: string) => void;
  onChannelPress?: (channelId: string) => void;
}

export function MrkdwnRenderer({
  content,
  members,
  channels,
  onMentionPress,
  onChannelPress,
}: MrkdwnRendererProps) {
  const segments = parseMrkdwn(content);
  const emojiOnly = isEmojiOnly(segments);

  return (
    <Text style={emojiOnly ? { fontSize: 32, lineHeight: 40 } : { fontSize: 16, lineHeight: 22 }}>
      {segments.map((segment, i) => (
        <Segment
          key={i}
          segment={segment}
          members={members}
          channels={channels}
          onMentionPress={onMentionPress}
          onChannelPress={onChannelPress}
        />
      ))}
    </Text>
  );
}

interface SegmentProps {
  segment: MrkdwnSegment;
  members?: WorkspaceMemberWithUser[];
  channels?: ChannelWithMembership[];
  onMentionPress?: (userId: string) => void;
  onChannelPress?: (channelId: string) => void;
}

function Segment({ segment, members, channels, onMentionPress, onChannelPress }: SegmentProps) {
  switch (segment.type) {
    case 'text':
      return <Text>{segment.content}</Text>;

    case 'bold':
      return <Text style={{ fontWeight: 'bold' }}>{segment.content}</Text>;

    case 'italic':
      return <Text style={{ fontStyle: 'italic' }}>{segment.content}</Text>;

    case 'strike':
      return <Text style={{ textDecorationLine: 'line-through' }}>{segment.content}</Text>;

    case 'code':
      return (
        <Text className="rounded bg-neutral-200 px-1 font-mono text-sm text-red-600 dark:bg-neutral-700 dark:text-red-400">
          {segment.content}
        </Text>
      );

    case 'code_block':
      return <CodeBlock content={segment.content} />;

    case 'link':
      return (
        <Text
          className="text-blue-500 underline dark:text-blue-400"
          onPress={() => Linking.openURL(segment.url)}
        >
          {segment.text}
        </Text>
      );

    case 'user_mention': {
      const member = members?.find((m) => m.user_id === segment.userId);
      const name = member?.display_name ?? 'Unknown';
      return (
        <Text
          className="rounded bg-blue-100 px-1 font-semibold text-blue-700 dark:bg-blue-900 dark:text-blue-300"
          onPress={() => onMentionPress?.(segment.userId)}
        >
          @{name}
        </Text>
      );
    }

    case 'channel_mention': {
      const channel = channels?.find((c) => c.id === segment.channelId);
      const name = channel?.name ?? 'unknown';
      return (
        <Text
          className="rounded bg-blue-100 px-1 font-semibold text-blue-700 dark:bg-blue-900 dark:text-blue-300"
          onPress={() => onChannelPress?.(segment.channelId)}
        >
          #{name}
        </Text>
      );
    }

    case 'special_mention': {
      const label = `@${segment.mentionType}`;
      return (
        <Text className="rounded bg-yellow-100 px-1 font-semibold text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
          {label}
        </Text>
      );
    }

    case 'emoji_shortcode': {
      const emoji = resolveStandardShortcode(segment.name);
      return <Text>{emoji ?? `:${segment.name}:`}</Text>;
    }

    case 'blockquote':
      return <BlockquoteView segments={segment.segments} />;

    case 'bullet_list':
      return <ListView items={segment.items} ordered={false} />;

    case 'ordered_list':
      return <ListView items={segment.items} ordered={true} />;

    case 'line_break':
      return <Text>{'\n'}</Text>;

    default:
      return null;
  }
}

function CodeBlock({ content }: { content: string }) {
  return (
    <View className="my-1 rounded-md bg-neutral-200 p-2 dark:bg-neutral-700">
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Text className="font-mono text-sm text-neutral-900 dark:text-neutral-100">{content}</Text>
      </ScrollView>
    </View>
  );
}

function BlockquoteView({ segments }: { segments: MrkdwnSegment[] }) {
  return (
    <View className="my-1 border-l-4 border-neutral-300 pl-3 dark:border-neutral-600">
      <Text
        className="text-neutral-600 dark:text-neutral-400"
        style={{ fontSize: 16, lineHeight: 22 }}
      >
        {segments.map((s, i) => (
          <Segment key={i} segment={s} />
        ))}
      </Text>
    </View>
  );
}

function ListView({ items, ordered }: { items: MrkdwnSegment[][]; ordered: boolean }) {
  return (
    <View className="my-1">
      {items.map((item, index) => (
        <View key={index} className="flex-row pl-2">
          <Text className="mr-2 text-neutral-500 dark:text-neutral-400" style={{ fontSize: 16 }}>
            {ordered ? `${index + 1}.` : '•'}
          </Text>
          <Text style={{ fontSize: 16, lineHeight: 22, flex: 1 }}>
            {item.map((s, i) => (
              <Segment key={i} segment={s} />
            ))}
          </Text>
        </View>
      ))}
    </View>
  );
}
