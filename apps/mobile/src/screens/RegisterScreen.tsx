import { useState } from 'react';
import {
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuth } from '@enzyme/shared';
import { ApiError } from '@enzyme/api-client';
import type { AuthScreenProps } from '../navigation/types';

export function RegisterScreen({ navigation }: AuthScreenProps<'Register'>) {
  const { register, isRegistering } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleRegister() {
    if (!email.trim() || !password || !displayName.trim()) {
      setError('All fields are required');
      return;
    }
    setError(null);
    try {
      await register({ email: email.trim(), password, display_name: displayName.trim() });
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message);
      } else {
        setError('An unexpected error occurred');
      }
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white dark:bg-neutral-900"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerClassName="flex-1 justify-center px-6"
        keyboardShouldPersistTaps="handled"
      >
        <Text className="mb-2 text-center text-3xl font-bold text-neutral-900 dark:text-white">
          Create account
        </Text>
        <Text className="mb-8 text-center text-base text-neutral-500 dark:text-neutral-400">
          Join your team on Enzyme
        </Text>

        <Text className="mb-1 text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Display name
        </Text>
        <TextInput
          className="mb-4 rounded-lg border border-neutral-300 bg-white px-4 py-3 text-base text-neutral-900 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
          placeholder="Your name"
          placeholderTextColor="#9ca3af"
          value={displayName}
          onChangeText={setDisplayName}
          autoCapitalize="words"
          textContentType="name"
          returnKeyType="next"
          editable={!isRegistering}
        />

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
          editable={!isRegistering}
        />

        <Text className="mb-1 text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Password
        </Text>
        <TextInput
          className="mb-6 rounded-lg border border-neutral-300 bg-white px-4 py-3 text-base text-neutral-900 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
          placeholder="Password"
          placeholderTextColor="#9ca3af"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textContentType="newPassword"
          returnKeyType="go"
          onSubmitEditing={handleRegister}
          editable={!isRegistering}
        />

        {error && <Text className="mb-4 text-sm text-red-500">{error}</Text>}

        <Pressable
          className="mb-4 rounded-lg bg-primary-600 px-4 py-3 active:bg-primary-700"
          onPress={handleRegister}
          disabled={isRegistering}
        >
          {isRegistering ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-center text-base font-semibold text-white">Create account</Text>
          )}
        </Pressable>

        <Pressable onPress={() => navigation.navigate('Login')} className="py-2">
          <Text className="text-center text-sm text-neutral-600 dark:text-neutral-400">
            Already have an account?{' '}
            <Text className="font-semibold text-primary-600 dark:text-primary-400">Sign in</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
