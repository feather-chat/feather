import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '@enzyme/shared';
import { ActivityIndicator, View } from 'react-native';
import { AuthStack } from './AuthStack';
import { MainStack } from './MainStack';

export function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-neutral-900">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>{isAuthenticated ? <MainStack /> : <AuthStack />}</NavigationContainer>
  );
}
