import { View, Text, Image } from 'react-native';
import { getInitials, getAvatarColor } from '@enzyme/shared';

const SIZES = {
  sm: { container: 28, text: 12 },
  md: { container: 36, text: 14 },
  lg: { container: 48, text: 18 },
} as const;

interface AvatarProps {
  user: { display_name: string; avatar_url?: string | null; id?: string };
  size: 'sm' | 'md' | 'lg';
}

export function Avatar({ user, size }: AvatarProps) {
  const { container, text } = SIZES[size];

  if (user.avatar_url) {
    return (
      <Image
        source={{ uri: user.avatar_url }}
        style={{ width: container, height: container, borderRadius: container / 2 }}
      />
    );
  }

  const colorClass = getAvatarColor(user.id ?? user.display_name);

  return (
    <View
      className={`items-center justify-center rounded-full ${colorClass}`}
      style={{ width: container, height: container }}
    >
      <Text className="font-semibold text-white" style={{ fontSize: text }}>
        {getInitials(user.display_name)}
      </Text>
    </View>
  );
}
