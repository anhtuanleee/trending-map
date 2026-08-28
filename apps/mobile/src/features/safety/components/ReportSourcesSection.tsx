import type { PublicReportSource } from '@trending-map/contracts';
import { ExternalLink, FileCheck2, UsersRound } from 'lucide-react-native';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';

const sourceLabels: Record<PublicReportSource['type'], string> = {
  community_eyewitness: 'Nhân chứng cộng đồng',
  photo_evidence: 'Ảnh hiện trường',
  video_evidence: 'Video hiện trường',
  official_notice: 'Thông báo chính thức',
  government_open_data: 'Dữ liệu mở nhà nước',
  news_report: 'Nguồn báo chí',
  organization_statement: 'Thông báo tổ chức',
  other: 'Nguồn khác',
};

function formatDate(value: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}

export function ReportSourcesSection({ sources }: { sources: PublicReportSource[] }) {
  if (sources.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.heading}>NGUỒN VÀ XUẤT XỨ</Text>
      {sources.map((source) => {
        const verified = source.verificationStatus === 'verified';
        const Icon = source.type === 'community_eyewitness' ? UsersRound : FileCheck2;
        const publishedDate = formatDate(source.publishedAt);
        const accessedDate = formatDate(source.accessedAt);
        const attribution = [source.author, source.publisher].filter(Boolean).join(' · ');
        return (
          <View key={source.id} style={styles.source}>
            <View style={[styles.icon, verified && styles.iconVerified]}>
              <Icon color={verified ? colors.official : colors.primary} size={18} />
            </View>
            <View style={styles.copy}>
              <Text style={styles.type}>{sourceLabels[source.type]}</Text>
              <Text style={styles.title}>
                {source.title ?? source.publisher ?? 'Không có tiêu đề'}
              </Text>
              {attribution ? <Text style={styles.meta}>{attribution}</Text> : null}
              {publishedDate ? <Text style={styles.meta}>Công bố {publishedDate}</Text> : null}
              {accessedDate ? <Text style={styles.meta}>Truy cập {accessedDate}</Text> : null}
              <Text style={styles.status}>
                {verified ? 'Nguồn đã được xác minh' : 'Nguồn chưa được xác minh'}
              </Text>
            </View>
            {source.url ? (
              <Pressable
                accessibilityLabel="Mở nguồn"
                style={styles.link}
                onPress={() => void Linking.openURL(source.url!)}
              >
                <ExternalLink color={colors.primary} size={18} />
              </Pressable>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: spacing.xl },
  heading: { color: colors.primary, fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  source: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.canvas,
    padding: spacing.md,
  },
  icon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
  },
  iconVerified: { backgroundColor: colors.officialSoft },
  copy: { flex: 1 },
  type: { color: colors.inkMuted, fontSize: 10, fontWeight: '800' },
  title: { marginTop: 2, color: colors.ink, fontSize: 13, fontWeight: '700' },
  meta: { marginTop: 2, color: colors.inkMuted, fontSize: 10 },
  status: { marginTop: 2, color: colors.inkMuted, fontSize: 10 },
  link: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
});
