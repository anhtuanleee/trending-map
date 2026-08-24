import { useLocalSearchParams } from 'expo-router';

import { ReportDetailScreen } from '@/features/reports';

export default function ReportDetailRoute() {
  const { id = '' } = useLocalSearchParams<{ id?: string }>();

  return <ReportDetailScreen id={id} />;
}
