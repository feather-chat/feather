import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type AuthStackParamList = {
  ServerUrl: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type MainStackParamList = {
  WorkspaceSwitcher: undefined;
  ChannelList: { workspaceId: string };
  Channel: {
    workspaceId: string;
    channelId: string;
    channelName: string;
    scrollToMessageId?: string;
  };
  Thread: { workspaceId: string; channelId: string; parentMessageId: string };
  Profile: { workspaceId: string; userId: string };
  ChannelDetails: { workspaceId: string; channelId: string };
  Search: { workspaceId: string };
  CreateChannel: { workspaceId: string };
  BrowseChannels: { workspaceId: string };
  VoiceChannel: { workspaceId: string; channelId: string; channelName: string };
};

export type AuthScreenProps<T extends keyof AuthStackParamList> = NativeStackScreenProps<
  AuthStackParamList,
  T
>;

export type MainScreenProps<T extends keyof MainStackParamList> = NativeStackScreenProps<
  MainStackParamList,
  T
>;
