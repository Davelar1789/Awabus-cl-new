import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../src/store/authStore.js';
import { useUiStore } from '../src/store/uiStore.js';
import { useOfflineQueueStore } from '../src/store/offlineQueueStore.js';
import { useOfflineSync } from '../src/hooks/useOfflineSync.js';

SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 10_000 },
  },
});

export default function RootLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authHydrated = useAuthStore((s) => s.isHydrated);
  const hydrateAuth = useAuthStore((s) => s.hydrate);
  const uiHydrated = useUiStore((s) => s.isHydrated);
  const hydrateUi = useUiStore((s) => s.hydrate);
  const queueHydrated = useOfflineQueueStore((s) => s.isHydrated);
  const hydrateQueue = useOfflineQueueStore((s) => s.hydrate);

  const ready = authHydrated && uiHydrated && queueHydrated;

  useOfflineSync();

  useEffect(() => {
    hydrateAuth();
    hydrateUi();
    hydrateQueue();
  }, [hydrateAuth, hydrateUi, hydrateQueue]);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Protected guard={!isAuthenticated}>
              <Stack.Screen name="(auth)" />
            </Stack.Protected>
            <Stack.Protected guard={isAuthenticated}>
              <Stack.Screen name="(app)" />
            </Stack.Protected>
          </Stack>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
