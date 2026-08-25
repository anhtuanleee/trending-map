import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
export async function getAuthSession(): Promise<Session | null> {
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export function observeAuthSession(onSessionChange: (session: Session | null) => void) {
  if (!supabase) return () => undefined;

  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    onSessionChange(session);
  });

  return () => data.subscription.unsubscribe();
}

export async function requestEmailOtp(email: string) {
  if (!supabase) return;

  const { error } = await supabase.auth.signInWithOtp({ email });
  if (error) throw error;
}

export async function verifyEmailOtp(email: string, token: string): Promise<Session | null> {
  if (!supabase) return null;

  const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
  if (error) throw error;
  return data.session;
}

export async function createGoogleSignInUrl(redirectTo: string): Promise<string> {
  if (!supabase) throw new Error('Google OAuth không khả dụng trong demo mode.');

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
  return data.url;
}

export async function exchangeOAuthCode(code: string): Promise<Session | null> {
  if (!supabase) return null;

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) throw error;
  return data.session;
}

export async function restoreOAuthSession(
  accessToken: string,
  refreshToken: string,
): Promise<Session | null> {
  if (!supabase) return null;

  const { data, error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (error) throw error;
  return data.session;
}

export async function signOutCurrentUser() {
  if (!supabase) return;

  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
