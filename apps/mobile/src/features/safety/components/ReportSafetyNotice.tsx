import type { ReportDetail } from '@trending-map/contracts';
import { CircleAlert, ShieldAlert } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';

type Props = Pick<
  ReportDetail,
  'verificationStatus' | 'moderationStatus' | 'visibilityStatus' | 'severity'
>;

export function ReportSafetyNotice({
  verificationStatus,
  moderationStatus,
  visibilityStatus,
  severity,
}: Props) {
  const critical = severity === 'critical';
  const factChecking = moderationStatus === 'fact_checking';
  const underReview = ['pending_review', 'in_review', 'legal_review'].includes(moderationStatus);
  const unverified = verificationStatus === 'unverified' || verificationStatus === 'disputed';
  const communityContent = verificationStatus !== 'official_verified';
  const limited = visibilityStatus === 'limited';

  if (!critical && !factChecking && !underReview && !unverified && !limited && !communityContent) {
    return null;
  }

  const title = factChecking
    ? 'Thông tin đang được kiểm tra'
    : limited
      ? 'Nội dung đang bị giới hạn'
      : unverified
        ? 'Báo cáo chưa được xác minh độc lập'
        : underReview
          ? 'Báo cáo đang chờ kiểm duyệt'
          : 'Thông tin do cộng đồng đóng góp';
  const body = critical
    ? 'Không dùng nội dung này thay cho hướng dẫn của cơ quan chức năng hoặc dịch vụ khẩn cấp.'
    : 'Nội dung cộng đồng không thay thế thông báo của cơ quan chức năng. Hãy đối chiếu nguồn chính thức trước quyết định quan trọng.';
  const Icon = critical || factChecking ? ShieldAlert : CircleAlert;

  return (
    <View style={[styles.notice, critical && styles.critical]}>
      <Icon color={critical ? colors.danger : colors.warning} size={20} />
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    marginTop: spacing.md,
    flexDirection: 'row',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.warning,
    borderRadius: radius.lg,
    backgroundColor: colors.warningSoft,
    padding: spacing.md,
  },
  critical: { borderColor: colors.danger, backgroundColor: colors.dangerSoft },
  copy: { flex: 1 },
  title: { color: colors.ink, fontSize: 13, fontWeight: '800' },
  body: { marginTop: 3, color: colors.inkMuted, fontSize: 12, lineHeight: 17 },
});
