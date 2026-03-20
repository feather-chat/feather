import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useAuth } from '@enzyme/shared';

export function HomeScreen() {
  const { user, workspaces, logout, isLoggingOut } = useAuth();

  return (
    <View className="flex-1 bg-white px-6 pt-8 dark:bg-neutral-900">
      <Text className="mb-1 text-2xl font-bold text-neutral-900 dark:text-white">
        Welcome, {user?.display_name}
      </Text>
      <Text className="mb-6 text-base text-neutral-500 dark:text-neutral-400">{user?.email}</Text>

      {workspaces && workspaces.length > 0 && (
        <View className="mb-8">
          <Text className="mb-3 text-lg font-semibold text-neutral-900 dark:text-white">
            Workspaces
          </Text>
          {workspaces.map((ws) => (
            <View
              key={ws.id}
              className="mb-2 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-800"
            >
              <Text className="text-base font-medium text-neutral-900 dark:text-white">
                {ws.name}
              </Text>
            </View>
          ))}
        </View>
      )}

      <Pressable
        className={`rounded-lg border border-red-300 px-4 py-3 active:bg-red-50 dark:border-red-700 dark:active:bg-red-900 ${isLoggingOut ? 'opacity-50' : ''}`}
        onPress={() => logout()}
        disabled={isLoggingOut}
      >
        {isLoggingOut ? (
          <ActivityIndicator color="#ef4444" />
        ) : (
          <Text className="text-center text-base font-semibold text-red-600 dark:text-red-400">
            Sign out
          </Text>
        )}
      </Pressable>
    </View>
  );
}
