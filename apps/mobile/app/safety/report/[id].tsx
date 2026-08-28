import { useLocalSearchParams } from 'expo-router';

import { ContentFlagScreen } from '@/features/safety';

export default function ContentFlagRoute() {
  const { id = '' } = useLocalSearchParams<{ id?: string }>();

  return <ContentFlagScreen reportId={id} />;
}
