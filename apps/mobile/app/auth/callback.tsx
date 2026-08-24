import { useLocalSearchParams } from 'expo-router';

import { OAuthCallbackScreen } from '@/features/auth';

export default function OAuthCallbackRoute() {
  const { returnTo = '/' } = useLocalSearchParams<{ returnTo?: string }>();

  return <OAuthCallbackScreen returnTo={returnTo} />;
}
