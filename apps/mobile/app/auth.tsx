import { colors, radius, spacing } from '@trending-map/ui-tokens';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, ShieldCheck } from 'lucide-react-native';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/providers/AuthProvider';

export default function AuthRoute() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { returnTo = '/' } = useLocalSearchParams<{ returnTo?: string }>();
  const { requestOtp, verifyOtp, demoMode } = useAuth();
  const [phone, setPhone] = useState('+84');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendOtp = async () => {
    setLoading(true);
    setError(null);
    try {
      await requestOtp(phone.replace(/\s/g, ''));
      setStep('otp');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Không thể gửi OTP.');
    } finally {
      setLoading(false);
    }
  };

  const submitOtp = async () => {
    setLoading(true);
    setError(null);
    try {
      await verifyOtp(phone.replace(/\s/g, ''), otp);
      router.replace(returnTo as never);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'OTP không hợp lệ.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.screen, { paddingTop: insets.top + spacing.md }]}
    >
      <Pressable style={styles.back} onPress={() => router.back()}>
        <ArrowLeft color={colors.ink} size={22} />
      </Pressable>

      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <ShieldCheck color={colors.primary} size={30} />
        </View>
        <Text style={styles.eyebrow}>CỘNG ĐỒNG TIN CẬY</Text>
        <Text style={styles.title}>Đăng nhập để đóng góp</Text>
        <Text style={styles.description}>
          Mọi người đều xem được bản đồ. Đăng nhập giúp hạn chế báo cáo giả và bảo vệ độ tin cậy của
          cộng đồng.
        </Text>

        {step === 'phone' ? (
          <>
            <Text style={styles.label}>Số điện thoại</Text>
            <TextInput
              accessibilityLabel="Số điện thoại"
              autoFocus
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              style={styles.input}
              placeholder="+84 912 345 678"
            />
            <Pressable style={styles.primaryButton} disabled={loading} onPress={sendOtp}>
              <Text style={styles.primaryButtonText}>{loading ? 'Đang gửi…' : 'Nhận mã OTP'}</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.label}>Mã OTP</Text>
            <TextInput
              accessibilityLabel="Mã OTP"
              autoFocus
              keyboardType="number-pad"
              maxLength={6}
              value={otp}
              onChangeText={setOtp}
              style={[styles.input, styles.otp]}
              placeholder="000000"
            />
            <Pressable style={styles.primaryButton} disabled={loading} onPress={submitOtp}>
              <Text style={styles.primaryButtonText}>
                {loading ? 'Đang xác minh…' : 'Xác minh'}
              </Text>
            </Pressable>
            <Pressable onPress={() => setStep('phone')}>
              <Text style={styles.link}>Đổi số điện thoại</Text>
            </Pressable>
          </>
        )}

        {demoMode ? (
          <Text style={styles.demo}>Demo mode: nhập một mã OTP bất kỳ gồm 6 số.</Text>
        ) : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas, paddingHorizontal: spacing.xl },
  back: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: colors.surface,
  },
  content: { flex: 1, justifyContent: 'center', paddingBottom: 80 },
  iconWrap: {
    width: 58,
    height: 58,
    borderRadius: 18,
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
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  link: { marginTop: spacing.lg, color: colors.primary, textAlign: 'center', fontWeight: '700' },
  demo: { marginTop: spacing.lg, color: colors.inkMuted, fontSize: 12, textAlign: 'center' },
  error: { marginTop: spacing.md, color: colors.danger, textAlign: 'center' },
});
