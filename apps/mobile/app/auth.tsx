import { useLocalSearchParams } from 'expo-router';

import { AuthScreen } from '@/features/auth/AuthScreen';

export default function AuthRoute() {
  const { returnTo = '/' } = useLocalSearchParams<{ returnTo?: string }>();

  return <AuthScreen returnTo={returnTo} />;
}
