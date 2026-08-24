import type { ReportDetail } from '@trending-map/contracts';
import { Check, Clock3, MapPin, X } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { StatusBadge } from '@/components/atoms';
import { colors, radius, spacing } from '@/theme';

type Props = {
  report: ReportDetail;
  onClose: () => void;
  onConfirm: () => void;
};

export function ReportPreviewCard({ report, onClose, onConfirm }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <StatusBadge status={report.verificationStatus} />
        <Pressable accessibilityLabel="Đóng chi tiết" onPress={onClose} hitSlop={12}>
          <X color={colors.inkMuted} size={20} />
        </Pressable>
      </View>
      <Text style={styles.eyebrow}>{report.categoryName}</Text>
      <Text style={styles.title}>{report.title}</Text>
      <View style={styles.metaRow}>
        <MapPin color={colors.inkMuted} size={15} />
        <Text style={styles.meta}>{report.addressLabel ?? 'Gần vị trí này'}</Text>
      </View>
      <View style={styles.metaRow}>
        <Clock3 color={colors.inkMuted} size={15} />
        <Text style={styles.meta}>Cập nhật gần đây · {report.confirmationCount} xác nhận</Text>
      </View>
      <Pressable style={styles.button} onPress={onConfirm}>
        <Check color="#fff" size={18} />
        <Text style={styles.buttonText}>Tôi cũng thấy</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: 100,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyebrow: { marginTop: spacing.md, color: colors.primary, fontSize: 12, fontWeight: '800' },
  title: { marginTop: 4, color: colors.ink, fontSize: 20, fontWeight: '800' },
  metaRow: { marginTop: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: 6 },
  meta: { color: colors.inkMuted, flex: 1, fontSize: 13 },
  button: {
    marginTop: spacing.lg,
    minHeight: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
