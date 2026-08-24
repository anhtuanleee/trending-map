import { useRouter } from 'expo-router';
import { ArrowLeft, ShieldCheck } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { safeReturnTo } from '@/lib/navigation';
import { colors, radius, spacing } from '@/theme';

import { useAuth } from '../providers/AuthProvider';

type AuthStep = 'email' | 'otp';

type Props = {
  returnTo: string;
};

const resendDelaySeconds = 60;

export function AuthScreen({ returnTo }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    requestOtp,
    verifyOtp,
    signInWithGoogle,
    demoMode,
    loading: sessionLoading,
    user,
  } = useAuth();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<AuthStep>('email');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);
  const returnPath = useMemo(() => safeReturnTo(returnTo), [returnTo]);

  useEffect(() => {
    if (!resendIn) return;
    const timer = setInterval(() => setResendIn((value) => Math.max(0, value - 1)), 1_000);
    return () => clearInterval(timer);
  }, [resendIn]);

  useEffect(() => {
    if (!sessionLoading && user && step === 'email') router.replace(returnPath as never);
  }, [returnPath, router, sessionLoading, step, user]);

  const sendOtp = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError('Nhập email hợp lệ, ví dụ ban@domain.com.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await requestOtp(normalizedEmail);
      setStep('otp');
      setResendIn(resendDelaySeconds);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Không thể gửi OTP.');
    } finally {
      setLoading(false);
    }
  };

  const submitOtp = async () => {
    if (!/^\d{6}$/.test(otp)) {
      setError('Mã OTP phải gồm đúng 6 chữ số.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await verifyOtp(normalizedEmail, otp);
      router.replace(returnPath as never);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'OTP không hợp lệ.');
    } finally {
      setLoading(false);
    }
  };

  const continueWithGoogle = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      await signInWithGoogle(returnPath);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Không thể đăng nhập bằng Google.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const goBack = () => {
    setError(null);
    if (step === 'otp') {
      setStep('email');
      setOtp('');
      return;
    }
    router.back();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xl },
        ]}
      >
        <Pressable accessibilityLabel="Quay lại" style={styles.back} onPress={goBack}>
          <ArrowLeft color={colors.ink} size={22} />
        </Pressable>

        <View style={styles.content}>
          <View style={styles.iconWrap}>
            <ShieldCheck color={colors.primary} size={30} />
          </View>
          <Text style={styles.eyebrow}>CỘNG ĐỒNG TIN CẬY</Text>
          <Text style={styles.title}>
            {step === 'email' ? 'Đăng nhập để đóng góp' : 'Nhập mã xác minh'}
          </Text>
          <Text style={styles.description}>
            {step === 'email'
              ? 'Không cần mật khẩu. Mọi người vẫn xem được bản đồ, tài khoản chỉ cần khi báo cáo hoặc xác nhận.'
              : `Mã OTP đã được gửi tới ${normalizedEmail}.`}
          </Text>

          {step === 'email' ? (
            <>
              <Pressable
                accessibilityLabel="Tiếp tục với Google"
                accessibilityRole="button"
                style={[styles.googleButton, googleLoading && styles.disabled]}
                disabled={loading || googleLoading}
                onPress={() => void continueWithGoogle()}
              >
                <Text style={styles.googleButtonText}>
                  {googleLoading ? 'Đang mở Google…' : 'Tiếp tục với Google'}
                </Text>
              </Pressable>
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>HOẶC DÙNG EMAIL</Text>
                <View style={styles.dividerLine} />
              </View>
              <Text style={styles.label}>Email</Text>
              <TextInput
                accessibilityLabel="Email"
                autoFocus
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                placeholder="ban@domain.com"
                placeholderTextColor={colors.inkMuted}
              />
              <Pressable
                accessibilityRole="button"
                style={[styles.primaryButton, (loading || googleLoading) && styles.disabled]}
                disabled={loading || googleLoading}
                onPress={() => void sendOtp()}
              >
                <Text style={styles.primaryButtonText}>
                  {loading ? 'Đang gửi…' : 'Nhận mã OTP'}
                </Text>
              </Pressable>
              <Pressable style={styles.secondaryButton} onPress={() => router.replace('/')}>
                <Text style={styles.secondaryButtonText}>Tiếp tục xem với tư cách khách</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.label}>Mã OTP gồm 6 số</Text>
              <TextInput
                accessibilityLabel="Mã OTP"
                autoFocus
                autoComplete="one-time-code"
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={(value) => setOtp(value.replace(/\D/g, ''))}
                style={[styles.input, styles.otp]}
                placeholder="000000"
                placeholderTextColor={colors.inkMuted}
              />
              <Pressable
                accessibilityRole="button"
                style={[styles.primaryButton, loading && styles.disabled]}
                disabled={loading}
                onPress={() => void submitOtp()}
              >
                <Text style={styles.primaryButtonText}>
                  {loading ? 'Đang xác minh…' : 'Xác minh và tiếp tục'}
                </Text>
              </Pressable>
              <Pressable
                style={styles.secondaryButton}
                disabled={loading || resendIn > 0}
                onPress={() => void sendOtp()}
              >
                <Text style={[styles.secondaryButtonText, resendIn > 0 && styles.mutedText]}>
                  {resendIn > 0 ? `Gửi lại mã sau ${resendIn} giây` : 'Gửi lại mã'}
                </Text>
              </Pressable>
              <Pressable onPress={goBack}>
                <Text style={styles.link}>Đổi email</Text>
              </Pressable>
            </>
          )}

          {demoMode ? (
            <Text style={styles.demo}>
              Demo mode: Google đăng nhập ngay; Email OTP chấp nhận mã bất kỳ gồm 6 số.
            </Text>
          ) : null}
          {error ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {error}
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  scrollContent: { flexGrow: 1, paddingHorizontal: spacing.xl },
  back: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: colors.surface,
  },
  content: { flex: 1, justifyContent: 'center', paddingVertical: spacing.xxl },
  iconWrap: {
    width: 58,
    height: 58,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  eyebrow: { marginTop: spacing.xl, color: colors.primary, fontSize: 12, fontWeight: '900' },
  title: { marginTop: spacing.sm, color: colors.ink, fontSize: 30, fontWeight: '900' },
  description: { marginTop: spacing.md, color: colors.inkMuted, fontSize: 15, lineHeight: 22 },
  googleButton: {
    marginTop: spacing.xl,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  googleButtonText: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  divider: { marginTop: spacing.xl, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { color: colors.inkMuted, fontSize: 11, fontWeight: '800' },
  label: { marginTop: spacing.xl, color: colors.ink, fontSize: 13, fontWeight: '800' },
  input: {
    marginTop: spacing.sm,
    minHeight: 54,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    color: colors.ink,
    paddingHorizontal: spacing.lg,
    fontSize: 17,
  },
  otp: { letterSpacing: 12, textAlign: 'center', fontSize: 22, fontWeight: '800' },
  primaryButton: {
    marginTop: spacing.lg,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  primaryButtonText: { color: colors.surface, fontSize: 16, fontWeight: '900' },
  secondaryButton: {
    marginTop: spacing.md,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
  },
  secondaryButtonText: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  mutedText: { color: colors.inkMuted },
  disabled: { opacity: 0.6 },
  link: { marginTop: spacing.lg, color: colors.primary, textAlign: 'center', fontWeight: '700' },
  demo: { marginTop: spacing.lg, color: colors.inkMuted, fontSize: 12, textAlign: 'center' },
  error: { marginTop: spacing.md, color: colors.danger, textAlign: 'center' },
});
