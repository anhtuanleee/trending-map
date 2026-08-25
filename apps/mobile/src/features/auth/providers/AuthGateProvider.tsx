import { useRouter } from 'expo-router';
import { ShieldCheck, X } from 'lucide-react-native';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { BottomSheetModal, Button } from '@/components/ui';
import { colors } from '@/theme';

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
      <BottomSheetModal
        accessibilityLabel="Đóng yêu cầu đăng nhập"
        visible={Boolean(pending)}
        onClose={close}
      >
        <View className="px-6 pb-3">
          <View className="flex-row items-center justify-between">
            <View className="h-12 w-12 items-center justify-center rounded-md bg-primary-soft">
              <ShieldCheck color={colors.primary} size={24} />
            </View>
            <Pressable
              accessibilityLabel="Đóng"
              className="h-11 w-11 items-center justify-center rounded-full bg-canvas active:opacity-70"
              onPress={close}
            >
              <X color={colors.inkMuted} size={20} />
            </Pressable>
          </View>
          <Text className="mt-6 text-2xl font-black text-ink">{pending?.title}</Text>
          <Text className="mt-2 text-[15px] leading-[22px] text-muted">
            Mày vẫn xem được toàn bộ bản đồ. Tài khoản chỉ cần khi báo cáo, xác nhận hoặc đánh giá.
          </Text>
          <Button className="mt-6" onPress={continueToAuth}>
            Đăng nhập bằng email
          </Button>
          <Button className="mt-3" variant="secondary" onPress={close}>
            Để sau
          </Button>
        </View>
      </BottomSheetModal>
    </AuthGateContext.Provider>
  );
}

export function useAuthGatePrompt() {
  const value = useContext(AuthGateContext);
  if (!value) throw new Error('useAuthGatePrompt must be used inside AuthGateProvider.');
  return value;
}
