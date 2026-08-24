export const reportQueryKeys = {
  all: ['reports'] as const,
  detail: (id: string) => [...reportQueryKeys.all, 'detail', id] as const,
  map: (scope: string) => [...reportQueryKeys.all, 'map', scope] as const,
};
