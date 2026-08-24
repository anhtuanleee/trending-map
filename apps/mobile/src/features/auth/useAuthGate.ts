import { useCallback } from 'react';

import { useAuth } from '@/providers/AuthProvider';

import { useAuthGatePrompt } from './AuthGateProvider';

export function useAuthGate() {
  const { user } = useAuth();
  const { openAuthGate } = useAuthGatePrompt();

  return useCallback(
    (returnTo: string, action: () => void, title?: string) => {
      if (user) {
        action();
        return;
      }

      openAuthGate(returnTo, title);
    },
    [openAuthGate, user],
  );
}
