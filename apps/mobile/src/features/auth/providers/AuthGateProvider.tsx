import { useRouter } from 'expo-router';
import { ShieldCheck, X } from 'lucide-react-native';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, spacing } from '@/theme';

type PendingAuth = {
  returnTo: string;
  title: string;
};

type AuthGateContextValue = {
  openAuthGate: (returnTo: string, title?: string) => void;
};

const AuthGateContext = createContext<AuthGateContextValue | null>(null);

export function AuthGateProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [pending, setPending] = useState<PendingAuth | null>(null);

  const openAuthGate = useCallback((returnTo: string, title = 'Đăng nhập để đóng góp') => {
    setPending({ returnTo, title });
  }, []);

  const close = () => setPending(null);
  const continueToAuth = () => {
    if (!pending) return;
    const returnTo = pending.returnTo;
    setPending(null);
    router.push({ pathname: '/auth', params: { returnTo } });
  };

  const value = useMemo(() => ({ openAuthGate }), [openAuthGate]);

  return (
    <AuthGateContext.Provider value={value}>
      {children}
      <Modal animationType="slide" onRequestClose={close} transparent visible={Boolean(pending)}>
        <Pressable
          accessibilityLabel="Đóng yêu cầu đăng nhập"
          style={styles.overlay}
          onPress={close}
        >
          <Pressable
            accessibilityViewIsModal
            style={[styles.sheet, { paddingBottom: insets.bottom + spacing.xl }]}
            onPress={(event) => event.stopPropagation()}
          >
            <View style={styles.handle} />
            <View style={styles.sheetHeader}>
              <View style={styles.iconWrap}>
                <ShieldCheck color={colors.accentInk} size={24} />
              </View>
              <Pressable accessibilityLabel="Đóng" style={styles.closeButton} onPress={close}>
                <X color={colors.inkMuted} size={20} />
              </Pressable>
            </View>
            <Text style={styles.title}>{pending?.title}</Text>
            <Text style={styles.description}>
              Mày vẫn xem được toàn bộ bản đồ. Tài khoản chỉ cần khi báo cáo, xác nhận hoặc đánh
              giá.
            </Text>
            <Pressable style={styles.primaryButton} onPress={continueToAuth}>
              <Text style={styles.primaryButtonText}>Tiếp tục đăng nhập</Text>
            </Pressable>
            <Pressable style={styles.secondaryButton} onPress={close}>
              <Text style={styles.secondaryButtonText}>Để sau</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </AuthGateContext.Provider>
  );
}

export function useAuthGatePrompt() {
  const value = useContext(AuthGateContext);
  if (!value) throw new Error('useAuthGatePrompt must be used inside AuthGateProvider.');
  return value;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    backgroundColor: colors.surface,
    padding: spacing.xl,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    marginBottom: spacing.xl,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  closeButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
  },
  title: {
    marginTop: spacing.xl,
    color: colors.ink,
    fontSize: 27,
    lineHeight: 34,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  description: { marginTop: spacing.sm, color: colors.inkMuted, fontSize: 15, lineHeight: 22 },
  primaryButton: {
    minHeight: 54,
    marginTop: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    backgroundColor: colors.accent,
  },
  primaryButtonText: { color: colors.accentInk, fontSize: 15, fontWeight: '800' },
  secondaryButton: {
    minHeight: 50,
    marginTop: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  secondaryButtonText: { color: colors.ink, fontSize: 14, fontWeight: '800' },
});
