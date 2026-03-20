import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type AuthStackParamList = {
  ServerUrl: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type MainStackParamList = {
  Home: undefined;
};

export type AuthScreenProps<T extends keyof AuthStackParamList> = NativeStackScreenProps<
  AuthStackParamList,
  T
>;

export type MainScreenProps<T extends keyof MainStackParamList> = NativeStackScreenProps<
  MainStackParamList,
  T
>;
