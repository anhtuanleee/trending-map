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
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/providers/AuthProvider';
import { colors, radius, spacing } from '@/theme';

const upcomingItems = [
  { label: 'Báo cáo của tôi', icon: FileText },
  { label: 'Khu vực đang theo dõi', icon: MapPinned },
  { label: 'Thông báo', icon: Bell },
] as const;

export function AccountScreen() {
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
    Alert.alert('Đăng xuất khỏi Mạch Phố?', 'Mày vẫn có thể xem bản đồ với tư cách khách.', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: () => void handleSignOut() },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.helper}>Đang tải tài khoản…</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View
        style={[
          styles.screen,
          { paddingTop: insets.top + spacing.md, paddingHorizontal: spacing.xl },
        ]}
      >
        <Pressable accessibilityLabel="Quay lại" style={styles.back} onPress={() => router.back()}>
          <ArrowLeft color={colors.ink} size={22} />
        </Pressable>
        <View style={styles.guestContent}>
          <View style={styles.largeIcon}>
            <ShieldCheck color={colors.primary} size={34} />
          </View>
          <Text style={styles.guestTitle}>Đăng nhập để quản lý tài khoản</Text>
          <Text style={styles.guestDescription}>
            Bản đồ vẫn mở cho mọi người. Đăng nhập khi mày muốn báo cáo, xác nhận hoặc theo dõi khu
            vực.
          </Text>
          <Pressable
            style={styles.primaryButton}
            onPress={() => router.push({ pathname: '/auth', params: { returnTo: '/account' } })}
          >
            <Text style={styles.primaryButtonText}>Đăng nhập bằng email</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={() => router.replace('/')}>
            <Text style={styles.secondaryButtonText}>Quay lại bản đồ</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const userSuffix = user.id.slice(-4).toUpperCase();
  const avatarLabel = user.email?.slice(0, 2).toUpperCase() ?? userSuffix.slice(-2);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.accountContent,
        { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xl },
      ]}
    >
      <View style={styles.header}>
        <Pressable accessibilityLabel="Quay lại" style={styles.back} onPress={() => router.back()}>
          <ArrowLeft color={colors.ink} size={22} />
        </Pressable>
        <Text style={styles.headerTitle}>Tài khoản</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.profile}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{avatarLabel}</Text>
        </View>
        <View style={styles.profileCopy}>
          <Text style={styles.profileName}>Người dùng {userSuffix}</Text>
          <Text style={styles.profileMeta}>{user.email ?? 'Tài khoản Mạch Phố'}</Text>
          {demoMode ? <Text style={styles.demoBadge}>DEMO MODE</Text> : null}
        </View>
      </View>

      <Text style={styles.sectionLabel}>TÀI KHOẢN</Text>
      <View style={styles.card}>
        <View style={styles.infoRow}>
          <Mail color={colors.inkMuted} size={20} />
          <View style={styles.rowCopy}>
            <Text style={styles.rowTitle}>Email</Text>
            <Text style={styles.rowMeta}>{user.email ?? 'Chưa có thông tin'}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionLabel}>CÁ NHÂN HÓA</Text>
      <View style={styles.card}>
        {upcomingItems.map(({ label, icon: Icon }, index) => (
          <View
            key={label}
            style={[styles.infoRow, index < upcomingItems.length - 1 && styles.rowBorder]}
          >
            <Icon color={colors.inkMuted} size={20} />
            <Text style={[styles.rowTitle, styles.rowCopy]}>{label}</Text>
            <Text style={styles.soon}>Sắp có</Text>
            <ChevronRight color={colors.border} size={18} />
          </View>
        ))}
      </View>

      <View style={styles.privacyCard}>
        <ShieldCheck color={colors.primary} size={20} />
        <Text style={styles.privacyCopy}>
          Chọn “Ẩn tên công khai” sẽ giấu danh tính trên report. Hệ thống vẫn giữ tài khoản để chống
          spam.
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        style={[styles.logoutButton, signingOut && styles.disabled]}
        disabled={signingOut}
        onPress={confirmSignOut}
      >
        {signingOut ? (
          <ActivityIndicator color={colors.danger} />
        ) : (
          <LogOut color={colors.danger} size={19} />
        )}
        <Text style={styles.logoutText}>{signingOut ? 'Đang đăng xuất…' : 'Đăng xuất'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: colors.canvas,
  },
  helper: { color: colors.inkMuted },
  accountContent: { paddingHorizontal: spacing.xl },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { color: colors.ink, fontSize: 18, fontWeight: '900' },
  headerSpacer: { width: 44 },
  back: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: colors.surface,
  },
  guestContent: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 80,
  },
  largeIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e5f1ec',
  },
  guestTitle: { marginTop: spacing.xl, color: colors.ink, fontSize: 28, fontWeight: '900' },
  guestDescription: {
    marginTop: spacing.md,
    color: colors.inkMuted,
    fontSize: 15,
    lineHeight: 23,
  },
  primaryButton: {
    minHeight: 54,
    marginTop: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
  },
  primaryButtonText: { color: colors.surface, fontSize: 15, fontWeight: '900' },
  secondaryButton: {
    minHeight: 50,
    marginTop: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  secondaryButtonText: { color: colors.ink, fontWeight: '800' },
  profile: {
    marginVertical: spacing.xxl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  avatar: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  avatarText: { color: colors.surface, fontSize: 18, fontWeight: '900' },
  profileCopy: { flex: 1 },
  profileName: { color: colors.ink, fontSize: 20, fontWeight: '900' },
  profileMeta: { marginTop: spacing.xs, color: colors.inkMuted, fontSize: 13 },
  demoBadge: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: '#e5f1ec',
    color: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontSize: 10,
    fontWeight: '900',
  },
  sectionLabel: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    color: colors.primary,
    fontSize: 11,
    fontWeight: '900',
  },
  card: { borderRadius: radius.lg, backgroundColor: colors.surface, paddingHorizontal: spacing.lg },
  infoRow: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  rowCopy: { flex: 1 },
  rowTitle: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  rowMeta: { marginTop: spacing.xs, color: colors.inkMuted, fontSize: 12 },
  soon: { color: colors.inkMuted, fontSize: 11, fontWeight: '700' },
  privacyCard: {
    marginTop: spacing.xl,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: '#e5f1ec',
    padding: spacing.lg,
  },
  privacyCopy: { flex: 1, color: colors.inkMuted, fontSize: 13, lineHeight: 19 },
  logoutButton: {
    minHeight: 54,
    marginTop: spacing.xxl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  logoutText: { color: colors.danger, fontSize: 15, fontWeight: '900' },
  disabled: { opacity: 0.6 },
});
