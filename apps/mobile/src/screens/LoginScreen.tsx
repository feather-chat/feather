import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '@enzyme/shared';
import { getErrorMessage } from '../lib/getErrorMessage';
import type { AuthScreenProps } from '../navigation/types';

export function LoginScreen({ navigation }: AuthScreenProps<'Login'>) {
  const { login, isLoggingIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    if (!email.trim() || !password) {
      setError('Email and password are required');
      return;
    }
    setError(null);
    try {
      await login({ email: email.trim(), password });
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white dark:bg-neutral-900"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View className="flex-1 justify-center px-6">
        <Text className="mb-2 text-center text-3xl font-bold text-neutral-900 dark:text-white">
          Sign in
        </Text>
        <Text className="mb-8 text-center text-base text-neutral-500 dark:text-neutral-400">
          Welcome back to Enzyme
        </Text>

        <Text className="mb-1 text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Email
        </Text>
        <TextInput
          className="mb-4 rounded-lg border border-neutral-300 bg-white px-4 py-3 text-base text-neutral-900 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
          placeholder="you@example.com"
          placeholderTextColor="#9ca3af"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="emailAddress"
          returnKeyType="next"
          editable={!isLoggingIn}
        />

        <Text className="mb-1 text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Password
        </Text>
        <TextInput
          className="mb-2 rounded-lg border border-neutral-300 bg-white px-4 py-3 text-base text-neutral-900 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
          placeholder="Password"
          placeholderTextColor="#9ca3af"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={handleLogin}
          editable={!isLoggingIn}
        />

        <Pressable onPress={() => navigation.navigate('ForgotPassword')} className="mb-6 self-end">
          <Text className="text-sm text-primary-600 dark:text-primary-400">Forgot password?</Text>
        </Pressable>

        {error && <Text className="mb-4 text-sm text-red-500">{error}</Text>}

        <Pressable
          className={`mb-4 rounded-lg bg-primary-600 px-4 py-3 active:bg-primary-700 ${isLoggingIn ? 'opacity-50' : ''}`}
          onPress={handleLogin}
          disabled={isLoggingIn}
        >
          {isLoggingIn ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-center text-base font-semibold text-white">Sign in</Text>
          )}
        </Pressable>

        <Pressable onPress={() => navigation.navigate('Register')} className="py-2">
          <Text className="text-center text-sm text-neutral-600 dark:text-neutral-400">
            Don't have an account?{' '}
            <Text className="font-semibold text-primary-600 dark:text-primary-400">Sign up</Text>
          </Text>
        </Pressable>

        <Pressable onPress={() => navigation.navigate('ServerUrl')} className="mt-4 py-2">
          <Text className="text-center text-sm text-neutral-500 dark:text-neutral-400">
            Change server
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
