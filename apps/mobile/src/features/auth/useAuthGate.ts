import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import { useAuth } from '@/providers/AuthProvider';

export function useAuthGate() {
  const { user } = useAuth();
  const router = useRouter();

  return useCallback(
    (returnTo: string, action: () => void) => {
      if (user) {
        action();
        return;
      }

      router.push({ pathname: '/auth', params: { returnTo } });
    },
    [router, user],
  );
}
