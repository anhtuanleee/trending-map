export function safeReturnTo(value: string | undefined, fallback = '/') {
  return value?.startsWith('/') && !value.startsWith('//') ? value : fallback;
}
