import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Bell,
  ChevronRight,
  FileText,
  LogOut,
  Mail,
  MapPinned,
  ShieldCheck,
} from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui';
import { colors, spacing } from '@/theme';

import { useAuth } from '../providers/AuthProvider';

const upcomingItems = [
  { label: 'Báo cáo của tôi', icon: FileText },
  { label: 'Khu vực đang theo dõi', icon: MapPinned },
  { label: 'Thông báo', icon: Bell },
] as const;

export function AccountScreen({ subscriptionEntry }: { subscriptionEntry?: React.ReactNode }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { user, loading, signOut, demoMode } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      queryClient.clear();
      router.replace('/signed-out');
    } catch (caught) {
      Alert.alert(
        'Không thể đăng xuất',
        caught instanceof Error ? caught.message : 'Hãy kiểm tra kết nối và thử lại.',
      );
    } finally {
      setSigningOut(false);
    }
  };

  const confirmSignOut = () => {
    Alert.alert('Đăng xuất khỏi Trending Map?', 'Mày vẫn có thể xem bản đồ với tư cách khách.', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: () => void handleSignOut() },
    ]);
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-canvas">
        <ActivityIndicator color={colors.primary} />
        <Text className="text-muted">Đang tải tài khoản…</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View className="flex-1 bg-canvas px-6" style={{ paddingTop: insets.top + spacing.md }}>
        <Pressable
          accessibilityLabel="Quay lại"
          className="h-11 w-11 items-center justify-center rounded-full bg-surface"
          onPress={() => router.back()}
        >
          <ArrowLeft color={colors.ink} size={22} />
        </Pressable>
        <View className="flex-1 justify-center pb-20">
          <View className="h-16 w-16 items-center justify-center rounded-lg bg-primary-soft">
            <ShieldCheck color={colors.primary} size={34} />
          </View>
          <Text className="mt-6 text-[28px] font-black text-ink">
            Đăng nhập để quản lý tài khoản
          </Text>
          <Text className="mt-3 text-[15px] leading-[23px] text-muted">
            Bản đồ vẫn mở cho mọi người. Đăng nhập khi mày muốn báo cáo, xác nhận hoặc theo dõi khu
            vực.
          </Text>
          <Button
            className="mt-6 min-h-[54px]"
            onPress={() => router.push({ pathname: '/auth', params: { returnTo: '/account' } })}
          >
            Đăng nhập bằng email
          </Button>
          <Button className="mt-3" variant="secondary" onPress={() => router.replace('/')}>
            Quay lại bản đồ
          </Button>
        </View>
      </View>
    );
  }

  const userSuffix = user.id.slice(-4).toUpperCase();
  const avatarLabel = user.email?.slice(0, 2).toUpperCase() ?? userSuffix.slice(-2);

  return (
    <ScrollView
      className="flex-1 bg-canvas"
      contentContainerStyle={{
        paddingHorizontal: spacing.xl,
        paddingTop: insets.top + spacing.md,
        paddingBottom: insets.bottom + spacing.xl,
      }}
    >
      <View className="flex-row items-center justify-between">
        <Pressable
          accessibilityLabel="Quay lại"
          className="h-11 w-11 items-center justify-center rounded-full bg-surface"
          onPress={() => router.back()}
        >
          <ArrowLeft color={colors.ink} size={22} />
        </Pressable>
        <Text className="text-lg font-black text-ink">Tài khoản</Text>
        <View className="w-11" />
      </View>

      <View className="my-8 flex-row items-center gap-4">
        <View className="h-[66px] w-[66px] items-center justify-center rounded-full bg-primary">
          <Text className="text-lg font-black text-white">{avatarLabel}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-xl font-black text-ink">Người dùng {userSuffix}</Text>
          <Text className="mt-1 text-[13px] text-muted">
            {user.email ?? 'Tài khoản Trending Map'}
          </Text>
          {demoMode ? (
            <Text className="mt-2 self-start rounded-pill bg-primary-soft px-2 py-1 text-[10px] font-black text-primary">
              DEMO MODE
            </Text>
          ) : null}
        </View>
      </View>

      <Text className="mb-2 mt-4 text-[11px] font-black text-primary">TÀI KHOẢN</Text>
      <View className="rounded-lg bg-surface px-4">
        <View className="min-h-[68px] flex-row items-center gap-3">
          <Mail color={colors.inkMuted} size={20} />
          <View className="flex-1">
            <Text className="text-sm font-extrabold text-ink">Email</Text>
            <Text className="mt-1 text-xs text-muted">{user.email ?? 'Chưa có thông tin'}</Text>
          </View>
        </View>
      </View>

      {subscriptionEntry}

      <Text className="mb-2 mt-4 text-[11px] font-black text-primary">CÁ NHÂN HÓA</Text>
      <View className="rounded-lg bg-surface px-4">
        {upcomingItems.map(({ label, icon: Icon }, index) => (
          <View
            key={label}
            className={`min-h-[68px] flex-row items-center gap-3 ${index < upcomingItems.length - 1 ? 'border-b border-border' : ''}`}
          >
            <Icon color={colors.inkMuted} size={20} />
            <Text className="flex-1 text-sm font-extrabold text-ink">{label}</Text>
            <Text className="text-[11px] font-bold text-muted">Sắp có</Text>
            <ChevronRight color={colors.border} size={18} />
          </View>
        ))}
      </View>

      <View className="mt-6 flex-row items-start gap-3 rounded-lg bg-primary-soft p-4">
        <ShieldCheck color={colors.primary} size={20} />
        <Text className="flex-1 text-[13px] leading-[19px] text-muted">
          Chọn “Ẩn tên công khai” sẽ giấu danh tính trên report. Hệ thống vẫn giữ tài khoản để chống
          spam.
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        className={`mt-8 min-h-[54px] flex-row items-center justify-center gap-2 rounded-md border border-border bg-surface ${signingOut ? 'opacity-60' : 'active:bg-danger-soft'}`}
        disabled={signingOut}
        onPress={confirmSignOut}
      >
        {signingOut ? (
          <ActivityIndicator color={colors.danger} />
        ) : (
          <LogOut color={colors.danger} size={19} />
        )}
        <Text className="text-[15px] font-black text-danger">
          {signingOut ? 'Đang đăng xuất…' : 'Đăng xuất'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
