import { useLocalSearchParams } from 'expo-router';

import { OAuthCallbackScreen } from '@/features/auth/OAuthCallbackScreen';

export default function OAuthCallbackRoute() {
  const { returnTo = '/' } = useLocalSearchParams<{ returnTo?: string }>();

  return <OAuthCallbackScreen returnTo={returnTo} />;
}
