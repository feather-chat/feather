import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { serverApi, setApiBase, getApiBase } from '@enzyme/api-client';
import { saveServerUrl, getServerUrl } from '../lib/serverStorage';
import type { AuthScreenProps } from '../navigation/types';

export function ServerUrlScreen({ navigation }: AuthScreenProps<'ServerUrl'>) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill saved URL on mount and auto-navigate if already configured
  useEffect(() => {
    let cancelled = false;
    getServerUrl().then((saved) => {
      if (cancelled) return;
      if (saved) {
        setUrl(saved);
        navigation.navigate('Login');
      }
    });
    return () => {
      cancelled = true;
    };
  }, [navigation]);

  async function handleConnect() {
    let trimmed = url.trim().replace(/\/+$/, '');
    if (!trimmed) {
      setError('Please enter a server URL');
      return;
    }

    // Auto-prepend https:// if no scheme provided
    if (!/^https?:\/\//i.test(trimmed)) {
      trimmed = `https://${trimmed}`;
      setUrl(trimmed);
    }

    // Reject http:// for non-localhost in production
    if (/^http:\/\//i.test(trimmed) && !__DEV__) {
      const hostMatch = trimmed.match(/^https?:\/\/([^/:]+)/i);
      const host = hostMatch?.[1];
      if (host !== 'localhost' && host !== '127.0.0.1') {
        setError('HTTPS is required for non-local servers');
        return;
      }
    }

    setLoading(true);
    setError(null);

    const apiUrl = `${trimmed}/api`;
    const previousBase = getApiBase();
    setApiBase(apiUrl);

    try {
      await serverApi.getServerInfo();
      await saveServerUrl(apiUrl);
      navigation.navigate('Login');
    } catch {
      setApiBase(previousBase);
      setError('Could not connect to server. Check the URL and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white dark:bg-neutral-900"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View className="flex-1 justify-center px-6">
        <Text className="mb-2 text-center text-3xl font-bold text-neutral-900 dark:text-white">
          Enzyme
        </Text>
        <Text className="mb-8 text-center text-base text-neutral-500 dark:text-neutral-400">
          Connect to your server
        </Text>

        <Text className="mb-1 text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Server URL
        </Text>
        <TextInput
          className="mb-4 rounded-lg border border-neutral-300 bg-white px-4 py-3 text-base text-neutral-900 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
          placeholder="https://chat.example.com"
          placeholderTextColor="#9ca3af"
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          returnKeyType="go"
          onSubmitEditing={handleConnect}
          editable={!loading}
        />

        {error && <Text className="mb-4 text-sm text-red-500">{error}</Text>}

        <Pressable
          className={`rounded-lg bg-primary-600 px-4 py-3 active:bg-primary-700 ${loading ? 'opacity-50' : ''}`}
          onPress={handleConnect}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-center text-base font-semibold text-white">Connect</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
