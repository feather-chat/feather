import './global.css';

import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { RootNavigator } from './src/navigation/RootNavigator';
import { bootstrap } from './src/lib/bootstrap';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    bootstrap().then(() => setReady(true));
  }, []);

  if (!ready) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <RootNavigator />
      <StatusBar style="auto" />
    </QueryClientProvider>
  );
}
