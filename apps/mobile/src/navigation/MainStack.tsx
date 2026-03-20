import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { MainStackParamList } from './types';
import { HomeScreen } from '../screens/HomeScreen';

const Stack = createNativeStackNavigator<MainStackParamList>();

export function MainStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Enzyme' }} />
    </Stack.Navigator>
  );
}
