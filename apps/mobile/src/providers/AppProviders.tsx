import { QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthGateProvider, AuthProvider } from '@/features/auth';
import { createAppQueryClient } from '@/lib/query/client';

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(createAppQueryClient);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <AuthGateProvider>{children}</AuthGateProvider>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
