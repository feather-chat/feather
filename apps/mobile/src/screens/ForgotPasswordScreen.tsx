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
import { authApi, ApiError } from '@enzyme/api-client';
import type { AuthScreenProps } from '../navigation/types';

export function ForgotPasswordScreen({ navigation }: AuthScreenProps<'ForgotPassword'>) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await authApi.forgotPassword(email.trim());
      setSent(true);
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6 dark:bg-neutral-900">
        <Text className="mb-2 text-center text-2xl font-bold text-neutral-900 dark:text-white">
          Check your email
        </Text>
        <Text className="mb-8 text-center text-base text-neutral-500 dark:text-neutral-400">
          If an account exists for {email}, we've sent password reset instructions.
        </Text>
        <Pressable onPress={() => navigation.navigate('Login')} className="py-2">
          <Text className="text-base font-semibold text-primary-600 dark:text-primary-400">
            Back to sign in
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white dark:bg-neutral-900"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View className="flex-1 justify-center px-6">
        <Text className="mb-2 text-center text-3xl font-bold text-neutral-900 dark:text-white">
          Reset password
        </Text>
        <Text className="mb-8 text-center text-base text-neutral-500 dark:text-neutral-400">
          Enter your email and we'll send you reset instructions
        </Text>

        <Text className="mb-1 text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Email
        </Text>
        <TextInput
          className="mb-6 rounded-lg border border-neutral-300 bg-white px-4 py-3 text-base text-neutral-900 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
          placeholder="you@example.com"
          placeholderTextColor="#9ca3af"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="emailAddress"
          returnKeyType="go"
          onSubmitEditing={handleSubmit}
          editable={!loading}
        />

        {error && <Text className="mb-4 text-sm text-red-500">{error}</Text>}

        <Pressable
          className="mb-4 rounded-lg bg-primary-600 px-4 py-3 active:bg-primary-700"
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-center text-base font-semibold text-white">Send reset link</Text>
          )}
        </Pressable>

        <Pressable onPress={() => navigation.navigate('Login')} className="py-2">
          <Text className="text-center text-sm text-primary-600 dark:text-primary-400">
            Back to sign in
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
