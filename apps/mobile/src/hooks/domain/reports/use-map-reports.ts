import { useQuery } from '@tanstack/react-query';

import { getMapReports } from '@/features/map/map.service';

import { reportQueryKeys } from './query-keys';

export function useMapReports(scope = 'hcm-center') {
  return useQuery({
    queryKey: reportQueryKeys.map(scope),
    queryFn: getMapReports,
  });
}
