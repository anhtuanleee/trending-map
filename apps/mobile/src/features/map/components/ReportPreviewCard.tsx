import type { MapItem } from '@trending-map/contracts';
import { ArrowRight, Clock3, MapPin, Sparkles, X } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { StatusBadge } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

type Props = {
  report: MapItem;
  onClose: () => void;
  onConfirm: () => void;
};

export function ReportPreviewCard({ report, onClose, onConfirm }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.handle} />
      <View style={styles.topRow}>
        <StatusBadge status={report.verificationStatus} />
        <Pressable accessibilityLabel="Đóng chi tiết" style={styles.close} onPress={onClose}>
          <X color={colors.inkMuted} size={20} />
        </Pressable>
      </View>
      <View style={styles.categoryRow}>
        <Sparkles color={colors.event} size={14} />
        <Text style={styles.eyebrow}>{report.categoryName}</Text>
      </View>
      <Text style={styles.title}>{report.title}</Text>
      <View style={styles.metaBlock}>
        <View style={styles.metaRow}>
          <MapPin color={colors.primary} size={15} />
          <Text style={styles.meta}>Gần vị trí này</Text>
        </View>
        <View style={styles.metaRow}>
          <Clock3 color={colors.primary} size={15} />
          <Text style={styles.meta}>Cập nhật gần đây · {report.confirmationCount} xác nhận</Text>
        </View>
      </View>
      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        onPress={onConfirm}
      >
        <Text style={styles.buttonText}>Xem chi tiết</Text>
        <ArrowRight color={colors.accentInk} size={18} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.xl,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    padding: spacing.lgPlus,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 32,
    elevation: 12,
  },
  handle: {
    alignSelf: 'center',
    width: 42,
    height: 5,
    marginBottom: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  close: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
  },
  categoryRow: { marginTop: spacing.md, flexDirection: 'row', alignItems: 'center', gap: 6 },
  eyebrow: { color: colors.event, fontSize: 11, fontWeight: '800', letterSpacing: 0.4 },
  title: { marginTop: 6, color: colors.ink, fontSize: 22, lineHeight: 28, fontWeight: '800' },
  metaBlock: {
    marginTop: spacing.lg,
    gap: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.canvas,
    padding: spacing.md,
  },
  metaRow: { marginTop: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: 6 },
  meta: { color: colors.inkMuted, flex: 1, fontSize: 12, fontWeight: '600' },
  button: {
    marginTop: spacing.lg,
    minHeight: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  buttonText: { color: colors.accentInk, fontSize: 15, fontWeight: '800' },
  pressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },
});
