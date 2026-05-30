import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { MainStackParamList } from './types';
import { WorkspaceSwitcherScreen } from '../screens/WorkspaceSwitcherScreen';
import { ChannelListScreen } from '../screens/ChannelListScreen';
import { ChannelScreen } from '../screens/ChannelScreen';
import { ThreadScreen } from '../screens/ThreadScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { ChannelDetailsScreen } from '../screens/ChannelDetailsScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { CreateChannelScreen } from '../screens/CreateChannelScreen';
import { BrowseChannelsScreen } from '../screens/BrowseChannelsScreen';
import { VoiceChannelScreen } from '../screens/VoiceChannelScreen';
import { useActiveWorkspace } from '../lib/WorkspaceProvider';
import { useSSELifecycle } from '../hooks/useSSELifecycle';

const Stack = createNativeStackNavigator<MainStackParamList>();

function SSEManager() {
  const { activeWorkspaceId } = useActiveWorkspace();
  useSSELifecycle(activeWorkspaceId);
  return null;
}

export function MainStack() {
  return (
    <>
      <SSEManager />
      <Stack.Navigator
        screenOptions={{
          headerShown: true,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen
          name="WorkspaceSwitcher"
          component={WorkspaceSwitcherScreen}
          options={{ title: 'Workspaces', headerBackVisible: false }}
        />
        <Stack.Screen name="ChannelList" component={ChannelListScreen} options={{ title: '' }} />
        <Stack.Screen
          name="Channel"
          component={ChannelScreen}
          options={({ route }) => ({ title: route.params.channelName })}
        />
        <Stack.Screen name="Thread" component={ThreadScreen} options={{ title: 'Thread' }} />
        <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
        <Stack.Screen
          name="ChannelDetails"
          component={ChannelDetailsScreen}
          options={{ title: 'Details' }}
        />
        <Stack.Screen name="Search" component={SearchScreen} options={{ title: 'Search' }} />
        <Stack.Screen
          name="CreateChannel"
          component={CreateChannelScreen}
          options={{ title: 'Create Channel' }}
        />
        <Stack.Screen
          name="BrowseChannels"
          component={BrowseChannelsScreen}
          options={{ title: 'Browse Channels' }}
        />
        <Stack.Screen
          name="VoiceChannel"
          component={VoiceChannelScreen}
          options={({ route }) => ({ title: route.params.channelName })}
        />
      </Stack.Navigator>
    </>
  );
}
