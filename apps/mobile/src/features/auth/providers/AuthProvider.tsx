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

import {
  createGoogleOAuthRedirectUrl,
  isOAuthCallbackUrl,
  parseOAuthCallbackUrl,
} from '../lib/oauth';
import { isDemoMode, supabase } from '@/services/supabase';

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
  const [loading, setLoading] = useState(Boolean(supabase));
  const [oauthStatus, setOAuthStatus] = useState<'idle' | 'processing' | 'error'>('idle');
  const [oauthError, setOAuthError] = useState<string | null>(null);
  const handledOAuthUrls = useRef(new Set<string>());

  const completeOAuthCallback = useCallback(async (url: string) => {
    if (!supabase || !isOAuthCallbackUrl(url) || handledOAuthUrls.current.has(url)) return;
    handledOAuthUrls.current.add(url);
    setOAuthStatus('processing');
    setOAuthError(null);

    try {
      const { accessToken, refreshToken, code, error: callbackError } = parseOAuthCallbackUrl(url);
      if (callbackError) throw new Error(callbackError);

      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) throw error;
        setUser(userFromSession(data.session));
      } else if (accessToken && refreshToken) {
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) throw error;
        setUser(userFromSession(data.session));
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
    if (!supabase) return;

    void supabase.auth.getSession().then(({ data }) => {
      setUser(userFromSession(data.session));
      setLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
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
      data.subscription.unsubscribe();
      linkingSubscription.remove();
    };
  }, [completeOAuthCallback]);

  const requestOtp = useCallback(async (email: string) => {
    if (!supabase) return;
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) throw error;
  }, []);

  const verifyOtp = useCallback(async (email: string, token: string) => {
    if (!supabase) {
      if (!/^\d{6}$/.test(token)) throw new Error('Mã OTP gồm 6 chữ số.');
      setUser({ id: 'demo-user', email });
      return;
    }

    const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
    if (error) throw error;
    setUser(userFromSession(data.session));
  }, []);

  const signInWithGoogle = useCallback(async (returnTo: string) => {
    if (!supabase) {
      setUser({ id: 'demo-google-user', email: 'google.demo@trendingmap.local' });
      return;
    }

    setOAuthStatus('idle');
    setOAuthError(null);
    const redirectTo = createGoogleOAuthRedirectUrl(returnTo);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true,
        queryParams: { prompt: 'select_account' },
      },
    });
    if (error) throw error;
    if (!data.url) throw new Error('Không thể tạo đường dẫn Google OAuth.');

    await Linking.openURL(data.url);
  }, []);

  const resetOAuthError = useCallback(() => {
    setOAuthStatus('idle');
    setOAuthError(null);
  }, []);

  const signOut = useCallback(async () => {
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    }
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
