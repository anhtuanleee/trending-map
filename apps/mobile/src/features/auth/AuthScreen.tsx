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

import { useAuth } from '@/providers/AuthProvider';
import { colors, radius, spacing } from '@/theme';

type AuthStep = 'phone' | 'otp';

type Props = {
  returnTo: string;
};

const resendDelaySeconds = 30;

export function AuthScreen({ returnTo }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { requestOtp, verifyOtp, demoMode, loading: sessionLoading, user } = useAuth();
  const [phone, setPhone] = useState('+84');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<AuthStep>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);

  const normalizedPhone = useMemo(() => phone.replace(/[\s()-]/g, ''), [phone]);
  const safeReturnTo = useMemo(() => (returnTo.startsWith('/') ? returnTo : '/'), [returnTo]);

  useEffect(() => {
    if (!resendIn) return;
    const timer = setInterval(() => setResendIn((value) => Math.max(0, value - 1)), 1_000);
    return () => clearInterval(timer);
  }, [resendIn]);

  useEffect(() => {
    if (!sessionLoading && user && step === 'phone') router.replace(safeReturnTo as never);
  }, [router, safeReturnTo, sessionLoading, step, user]);

  const sendOtp = async () => {
    if (!/^\+[1-9]\d{7,14}$/.test(normalizedPhone)) {
      setError('Nhập số điện thoại kèm mã quốc gia, ví dụ +84 912 345 678.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await requestOtp(normalizedPhone);
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
      await verifyOtp(normalizedPhone, otp);
      router.replace(safeReturnTo as never);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'OTP không hợp lệ.');
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    setError(null);
    if (step === 'otp') {
      setStep('phone');
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
            {step === 'phone' ? 'Đăng nhập để đóng góp' : 'Nhập mã xác minh'}
          </Text>
          <Text style={styles.description}>
            {step === 'phone'
              ? 'Không cần mật khẩu. Mọi người vẫn xem được bản đồ, tài khoản chỉ cần khi báo cáo hoặc xác nhận.'
              : `Mã OTP đã được gửi tới ${phone}.`}
          </Text>

          {step === 'phone' ? (
            <>
              <Text style={styles.label}>Số điện thoại</Text>
              <TextInput
                accessibilityLabel="Số điện thoại"
                autoFocus
                autoComplete="tel"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                style={styles.input}
                placeholder="+84 912 345 678"
                placeholderTextColor={colors.inkMuted}
              />
              <Pressable
                accessibilityRole="button"
                style={[styles.primaryButton, loading && styles.disabled]}
                disabled={loading}
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
                autoComplete="sms-otp"
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
                <Text style={styles.link}>Đổi số điện thoại</Text>
              </Pressable>
            </>
          )}

          {demoMode ? (
            <Text style={styles.demo}>Demo mode: nhập một mã OTP bất kỳ gồm 6 số.</Text>
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
    backgroundColor: '#e5f1ec',
  },
  eyebrow: { marginTop: spacing.xl, color: colors.primary, fontSize: 12, fontWeight: '900' },
  title: { marginTop: spacing.sm, color: colors.ink, fontSize: 30, fontWeight: '900' },
  description: { marginTop: spacing.md, color: colors.inkMuted, fontSize: 15, lineHeight: 22 },
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
