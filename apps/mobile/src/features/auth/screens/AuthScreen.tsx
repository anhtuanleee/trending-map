import { useRouter } from 'expo-router';
import { ArrowLeft, ShieldCheck } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui';
import { safeReturnTo } from '@/lib/navigation';
import { colors, spacing } from '@/theme';

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
      className="flex-1 bg-canvas"
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          { flexGrow: 1, paddingHorizontal: spacing.xl },
          { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xl },
        ]}
      >
        <Pressable
          accessibilityLabel="Quay lại"
          className="h-11 w-11 items-center justify-center rounded-full bg-surface active:bg-primary-soft"
          onPress={goBack}
        >
          <ArrowLeft color={colors.ink} size={22} />
        </Pressable>

        <View className="flex-1 justify-center py-8">
          <View className="h-[58px] w-[58px] items-center justify-center rounded-lg bg-primary-soft">
            <ShieldCheck color={colors.primary} size={30} />
          </View>
          <Text className="mt-6 text-xs font-black text-primary">CỘNG ĐỒNG TIN CẬY</Text>
          <Text className="mt-2 text-3xl font-black text-ink">
            {step === 'email' ? 'Đăng nhập để đóng góp' : 'Nhập mã xác minh'}
          </Text>
          <Text className="mt-3 text-[15px] leading-[22px] text-muted">
            {step === 'email'
              ? 'Không cần mật khẩu. Mọi người vẫn xem được bản đồ, tài khoản chỉ cần khi báo cáo hoặc xác nhận.'
              : `Mã OTP đã được gửi tới ${normalizedEmail}.`}
          </Text>

          {step === 'email' ? (
            <>
              <Button
                accessibilityLabel="Tiếp tục với Google"
                className="mt-6 min-h-[54px]"
                disabled={loading || googleLoading}
                loading={googleLoading}
                variant="secondary"
                onPress={() => void continueWithGoogle()}
              >
                {googleLoading ? 'Đang mở Google…' : 'Tiếp tục với Google'}
              </Button>
              <View className="mt-6 flex-row items-center gap-3">
                <View className="h-px flex-1 bg-border" />
                <Text className="text-[11px] font-extrabold text-muted">HOẶC DÙNG EMAIL</Text>
                <View className="h-px flex-1 bg-border" />
              </View>
              <Text className="mt-6 text-[13px] font-extrabold text-ink">Email</Text>
              <TextInput
                accessibilityLabel="Email"
                autoFocus
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                className="mt-2 min-h-[54px] rounded-md border border-border bg-surface px-4 text-[17px] text-ink"
                placeholder="ban@domain.com"
                placeholderTextColor={colors.inkMuted}
              />
              <Button
                className="mt-4 min-h-[54px]"
                disabled={loading || googleLoading}
                loading={loading}
                onPress={() => void sendOtp()}
              >
                {loading ? 'Đang gửi…' : 'Nhận mã OTP'}
              </Button>
              <Button className="mt-3" variant="secondary" onPress={() => router.replace('/')}>
                Tiếp tục xem với tư cách khách
              </Button>
            </>
          ) : (
            <>
              <Text className="mt-6 text-[13px] font-extrabold text-ink">Mã OTP gồm 6 số</Text>
              <TextInput
                accessibilityLabel="Mã OTP"
                autoFocus
                autoComplete="one-time-code"
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={(value) => setOtp(value.replace(/\D/g, ''))}
                className="mt-2 min-h-[54px] rounded-md border border-border bg-surface px-4 text-center text-[22px] font-extrabold tracking-[12px] text-ink"
                placeholder="000000"
                placeholderTextColor={colors.inkMuted}
              />
              <Button
                className="mt-4 min-h-[54px]"
                disabled={loading}
                loading={loading}
                onPress={() => void submitOtp()}
              >
                {loading ? 'Đang xác minh…' : 'Xác minh và tiếp tục'}
              </Button>
              <Button
                className="mt-3"
                disabled={loading || resendIn > 0}
                variant="secondary"
                onPress={() => void sendOtp()}
              >
                {resendIn > 0 ? `Gửi lại mã sau ${resendIn} giây` : 'Gửi lại mã'}
              </Button>
              <Pressable onPress={goBack}>
                <Text className="mt-4 text-center font-bold text-primary">Đổi email</Text>
              </Pressable>
            </>
          )}

          {demoMode ? (
            <Text className="mt-4 text-center text-xs text-muted">
              Demo mode: Google đăng nhập ngay; Email OTP chấp nhận mã bất kỳ gồm 6 số.
            </Text>
          ) : null}
          {error ? (
            <Text accessibilityRole="alert" className="mt-3 text-center text-danger">
              {error}
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
