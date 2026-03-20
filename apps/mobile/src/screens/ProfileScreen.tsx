import { View, Text, ActivityIndicator } from 'react-native';
import type { MainScreenProps } from '../navigation/types';
import { useWorkspaceMembers } from '@enzyme/shared';
import { Avatar } from '../components/Avatar';

export function ProfileScreen({ route }: MainScreenProps<'Profile'>) {
  const { workspaceId, userId } = route.params;
  const { data: membersData } = useWorkspaceMembers(workspaceId);
  const member = membersData?.members?.find((m) => m.user_id === userId);

  if (!member) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-neutral-900">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white px-6 pt-8 dark:bg-neutral-900">
      <View className="items-center">
        <Avatar
          user={{ display_name: member.display_name, avatar_url: member.avatar_url }}
          size="lg"
        />
        <Text className="mt-4 text-xl font-bold text-neutral-900 dark:text-white">
          {member.display_name}
        </Text>
        <Text className="mt-1 text-base text-neutral-500 dark:text-neutral-400">
          {member.email}
        </Text>
        <Text className="mt-2 text-sm capitalize text-neutral-500 dark:text-neutral-400">
          {member.role}
        </Text>
      </View>
    </View>
  );
}
