import type { Session } from '@supabase/supabase-js';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Linking } from 'react-native';

import { isDemoMode } from '@/lib/supabase/client';

import {
  createGoogleSignInUrl,
  exchangeOAuthCode,
  getAuthSession,
  observeAuthSession,
  requestEmailOtp,
  restoreOAuthSession,
  signOutCurrentUser,
  verifyEmailOtp,
} from '../api/auth.service';
import {
  createGoogleOAuthRedirectUrl,
  isOAuthCallbackUrl,
  parseOAuthCallbackUrl,
} from '../lib/oauth';

type AppUser = {
  id: string;
  email?: string;
};

type AuthContextValue = {
  user: AppUser | null;
  loading: boolean;
  demoMode: boolean;
  requestOtp: (email: string) => Promise<void>;
  verifyOtp: (email: string, token: string) => Promise<void>;
  signInWithGoogle: (returnTo: string) => Promise<void>;
  oauthStatus: 'idle' | 'processing' | 'error';
  oauthError: string | null;
  resetOAuthError: () => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function userFromSession(session: Session | null): AppUser | null {
  if (!session?.user) return null;
  return { id: session.user.id, email: session.user.email };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(!isDemoMode);
  const [oauthStatus, setOAuthStatus] = useState<'idle' | 'processing' | 'error'>('idle');
  const [oauthError, setOAuthError] = useState<string | null>(null);
  const handledOAuthUrls = useRef(new Set<string>());

  const completeOAuthCallback = useCallback(async (url: string) => {
    if (isDemoMode || !isOAuthCallbackUrl(url) || handledOAuthUrls.current.has(url)) return;
    handledOAuthUrls.current.add(url);
    setOAuthStatus('processing');
    setOAuthError(null);

    try {
      const { accessToken, refreshToken, code, error: callbackError } = parseOAuthCallbackUrl(url);
      if (callbackError) throw new Error(callbackError);

      if (code) {
        setUser(userFromSession(await exchangeOAuthCode(code)));
      } else if (accessToken && refreshToken) {
        setUser(userFromSession(await restoreOAuthSession(accessToken, refreshToken)));
      } else {
        throw new Error('Google không trả về session hợp lệ. Hãy thử đăng nhập lại.');
      }

      setOAuthStatus('idle');
    } catch (caught) {
      setOAuthStatus('error');
      setOAuthError(caught instanceof Error ? caught.message : 'Không thể hoàn tất Google OAuth.');
    }
  }, []);

  useEffect(() => {
    if (isDemoMode) return;

    void getAuthSession()
      .then((session) => setUser(userFromSession(session)))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
    const stopObservingAuth = observeAuthSession((session) => {
      setUser(userFromSession(session));
      setLoading(false);
    });

    void Linking.getInitialURL().then((url) => {
      if (url) void completeOAuthCallback(url);
    });
    const linkingSubscription = Linking.addEventListener('url', ({ url }) => {
      void completeOAuthCallback(url);
    });

    return () => {
      stopObservingAuth();
      linkingSubscription.remove();
    };
  }, [completeOAuthCallback]);

  const requestOtp = useCallback(async (email: string) => {
    await requestEmailOtp(email);
  }, []);

  const verifyOtp = useCallback(async (email: string, token: string) => {
    if (isDemoMode) {
      if (!/^\d{6}$/.test(token)) throw new Error('Mã OTP gồm 6 chữ số.');
      setUser({ id: 'demo-user', email });
      return;
    }

    setUser(userFromSession(await verifyEmailOtp(email, token)));
  }, []);

  const signInWithGoogle = useCallback(async (returnTo: string) => {
    if (isDemoMode) {
      setUser({ id: 'demo-google-user', email: 'google.demo@trendingmap.local' });
      return;
    }

    setOAuthStatus('idle');
    setOAuthError(null);
    const redirectTo = createGoogleOAuthRedirectUrl(returnTo);
    await Linking.openURL(await createGoogleSignInUrl(redirectTo));
  }, []);

  const resetOAuthError = useCallback(() => {
    setOAuthStatus('idle');
    setOAuthError(null);
  }, []);

  const signOut = useCallback(async () => {
    await signOutCurrentUser();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      demoMode: isDemoMode,
      requestOtp,
      verifyOtp,
      signInWithGoogle,
      oauthStatus,
      oauthError,
      resetOAuthError,
      signOut,
    }),
    [
      loading,
      oauthError,
      oauthStatus,
      requestOtp,
      resetOAuthError,
      signInWithGoogle,
      signOut,
      user,
      verifyOtp,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider.');
  return value;
}
