import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Check, Clock3, MapPin, X } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StatusBadge } from '@/components/atoms';
import { useAuthGate } from '@/features/auth/useAuthGate';
import { useConfirmReport, useReport } from '@/hooks/domain';
import { colors, radius, spacing } from '@/theme';

export default function ReportDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const requireAuth = useAuthGate();
  const reportQuery = useReport(id);
  const confirmation = useConfirmReport(id);

  const handleConfirmation = (kind: 'seen' | 'not_there') => {
    requireAuth(`/report/${id}`, () => confirmation.mutate(kind), 'Đăng nhập để xác nhận');
  };

  const report = reportQuery.data;
  if (!report) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.description}>
          {reportQuery.isLoading ? 'Đang tải…' : 'Không tìm thấy báo cáo.'}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
      <View style={[styles.hero, { paddingTop: insets.top + spacing.md }]}>
        <Pressable style={styles.back} onPress={() => router.back()}>
          <ArrowLeft color={colors.ink} size={22} />
        </Pressable>
        <Text style={styles.heroSymbol}>{report.categorySlug === 'music' ? '♪' : '!'}</Text>
        <Text style={styles.category}>{report.categoryName.toUpperCase()}</Text>
      </View>

      <View style={styles.content}>
        <StatusBadge status={report.verificationStatus} />
        <Text style={styles.title}>{report.title}</Text>
        <View style={styles.metaRow}>
          <MapPin color={colors.inkMuted} size={17} />
          <Text style={styles.meta}>{report.addressLabel}</Text>
        </View>
        <View style={styles.metaRow}>
          <Clock3 color={colors.inkMuted} size={17} />
          <Text style={styles.meta}>{report.confirmationCount} người đã xác nhận</Text>
        </View>
        <View style={styles.divider} />
        <Text style={styles.sectionLabel}>THÔNG TIN HIỆN TRƯỜNG</Text>
        <Text style={styles.description}>{report.description}</Text>

        <View style={styles.actionRow}>
          <Pressable
            style={[styles.primaryAction, confirmation.isPending && styles.disabled]}
            disabled={confirmation.isPending}
            onPress={() => handleConfirmation('seen')}
          >
            <Check color="#fff" size={18} />
            <Text style={styles.primaryActionText}>Tôi cũng thấy</Text>
          </Pressable>
          <Pressable
            style={[styles.secondaryAction, confirmation.isPending && styles.disabled]}
            disabled={confirmation.isPending}
            onPress={() => handleConfirmation('not_there')}
          >
            <X color={colors.ink} size={18} />
            <Text style={styles.secondaryActionText}>Không còn</Text>
          </Pressable>
        </View>
        {confirmation.isSuccess ? (
          <Text style={styles.success}>Cảm ơn bạn đã xác nhận.</Text>
        ) : null}
        {confirmation.isError ? <Text style={styles.error}>Không thể gửi xác nhận.</Text> : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.canvas,
  },
  hero: {
    minHeight: 260,
    paddingHorizontal: spacing.lg,
    backgroundColor: '#dfece6',
  },
  back: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  heroSymbol: {
    marginTop: 30,
    color: colors.primary,
    fontSize: 72,
    fontWeight: '900',
    textAlign: 'center',
  },
  category: { color: colors.primary, fontSize: 12, fontWeight: '900', textAlign: 'center' },
  content: { padding: spacing.xl },
  title: {
    marginTop: spacing.md,
    color: colors.ink,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
  },
  metaRow: { marginTop: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  meta: { flex: 1, color: colors.inkMuted, fontSize: 14 },
  divider: { height: 1, marginVertical: spacing.xl, backgroundColor: colors.border },
  sectionLabel: { color: colors.primary, fontSize: 11, fontWeight: '900' },
  description: { marginTop: spacing.sm, color: colors.inkMuted, fontSize: 16, lineHeight: 25 },
  actionRow: { marginTop: spacing.xl, flexDirection: 'row', gap: spacing.sm },
  primaryAction: {
    flex: 1,
    minHeight: 52,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  primaryActionText: { color: '#fff', fontWeight: '900' },
  secondaryAction: {
    flex: 1,
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  secondaryActionText: { color: colors.ink, fontWeight: '800' },
  success: { marginTop: spacing.md, color: colors.primary, textAlign: 'center' },
  error: { marginTop: spacing.md, color: colors.danger, textAlign: 'center' },
  disabled: { opacity: 0.6 },
});
