export const googleOAuthCallbackUrl = 'trendingmap://auth/callback';

export type OAuthCallbackParams = {
  accessToken?: string;
  refreshToken?: string;
  code?: string;
  error?: string;
};

function decodeValue(value: string) {
  try {
    return decodeURIComponent(value.replace(/\+/g, ' '));
  } catch {
    return value;
  }
}

function collectParams(section: string, target: Map<string, string>) {
  for (const pair of section.split('&')) {
    if (!pair) continue;
    const separator = pair.indexOf('=');
    const rawKey = separator >= 0 ? pair.slice(0, separator) : pair;
    const rawValue = separator >= 0 ? pair.slice(separator + 1) : '';
    target.set(decodeValue(rawKey), decodeValue(rawValue));
  }
}

export function isOAuthCallbackUrl(url: string) {
  return url.startsWith(googleOAuthCallbackUrl);
}

export function createGoogleOAuthRedirectUrl(returnTo: string) {
  const safeReturnTo = returnTo.startsWith('/') && !returnTo.startsWith('//') ? returnTo : '/';
  return `${googleOAuthCallbackUrl}?returnTo=${encodeURIComponent(safeReturnTo)}`;
}

export function parseOAuthCallbackUrl(url: string): OAuthCallbackParams {
  const params = new Map<string, string>();
  const queryStart = url.indexOf('?');
  const fragmentStart = url.indexOf('#');

  if (queryStart >= 0) {
    const queryEnd = fragmentStart >= 0 ? fragmentStart : url.length;
    collectParams(url.slice(queryStart + 1, queryEnd), params);
  }
  if (fragmentStart >= 0) collectParams(url.slice(fragmentStart + 1), params);

  return {
    accessToken: params.get('access_token'),
    refreshToken: params.get('refresh_token'),
    code: params.get('code'),
    error: params.get('error_description') ?? params.get('error'),
  };
}
