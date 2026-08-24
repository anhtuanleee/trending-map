import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { isDemoMode, supabase } from '@/services/supabase';

type AppUser = {
  id: string;
  phone?: string;
};

type AuthContextValue = {
  user: AppUser | null;
  loading: boolean;
  demoMode: boolean;
  requestOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, token: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function userFromSession(session: Session | null): AppUser | null {
  if (!session?.user) return null;
  return { id: session.user.id, phone: session.user.phone };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(Boolean(supabase));

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

    return () => data.subscription.unsubscribe();
  }, []);

  const requestOtp = useCallback(async (phone: string) => {
    if (!supabase) return;
    const { error } = await supabase.auth.signInWithOtp({ phone });
    if (error) throw error;
  }, []);

  const verifyOtp = useCallback(async (phone: string, token: string) => {
    if (!supabase) {
      if (!/^\d{6}$/.test(token)) throw new Error('Mã OTP gồm 6 chữ số.');
      setUser({ id: 'demo-user', phone });
      return;
    }

    const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
    if (error) throw error;
    setUser(userFromSession(data.session));
  }, []);

  const signOut = useCallback(async () => {
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    }
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, demoMode: isDemoMode, requestOtp, verifyOtp, signOut }),
    [loading, requestOtp, signOut, user, verifyOtp],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider.');
  return value;
}
