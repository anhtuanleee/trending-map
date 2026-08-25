import type { LocalReportImage } from '@trending-map/contracts';
import * as ImagePicker from 'expo-image-picker';
import { ImagePlus, LockKeyhole, Settings, X } from 'lucide-react-native';
import { useState } from 'react';
import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';

import { sanitizeReportImage } from '../lib/report-image';

export function PhotoEvidencePicker({
  images,
  onChange,
  disabled = false,
}: {
  images: LocalReportImage[];
  onChange: (images: LocalReportImage[]) => void;
  disabled?: boolean;
}) {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);
  const remaining = 3 - images.length;

  const pickImages = async () => {
    if (remaining <= 0 || processing || disabled) return;
    setError(null);

    const current = await ImagePicker.getMediaLibraryPermissionsAsync();
    const permission = current.granted
      ? current
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setBlocked(!permission.canAskAgain);
      setError('Cần quyền thư viện ảnh để chọn bằng chứng.');
      return;
    }
    setBlocked(false);

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 1,
      exif: false,
    });
    if (result.canceled) return;

    setProcessing(true);
    try {
      const sanitized: LocalReportImage[] = [];
      for (const asset of result.assets.slice(0, remaining)) {
        sanitized.push(
          await sanitizeReportImage({
            uri: asset.uri,
            width: asset.width,
            height: asset.height,
            fileSize: asset.fileSize,
          }),
        );
      }
      onChange([...images, ...sanitized].slice(0, 3));
    } catch (caught) {
      setError(
        caught instanceof Error && caught.message === 'source_image_too_large'
          ? 'Ảnh nguồn quá lớn. Hãy chọn ảnh dưới 20 MB.'
          : 'Không thể xử lý ảnh. Hãy thử ảnh khác.',
      );
    } finally {
      setProcessing(false);
    }
  };

  return (
    <View>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Ảnh hiện trường</Text>
          <Text style={styles.meta}>{images.length}/3 ảnh · JPEG tối đa 5 MB</Text>
        </View>
        <View style={styles.privateBadge}>
          <LockKeyhole color={colors.primary} size={13} />
          <Text style={styles.privateText}>Chờ duyệt</Text>
        </View>
      </View>

      <View style={styles.grid}>
        {images.map((image) => (
          <View key={image.idempotencyKey} style={styles.previewWrap}>
            <Image source={{ uri: image.uri }} style={styles.preview} />
            <Pressable
              accessibilityLabel="Xóa ảnh"
              style={styles.remove}
              onPress={() =>
                onChange(images.filter((item) => item.idempotencyKey !== image.idempotencyKey))
              }
            >
              <X color={colors.onPrimary} size={14} />
            </Pressable>
          </View>
        ))}
        {remaining > 0 ? (
          <Pressable
            disabled={processing || disabled}
            style={({ pressed }) => [
              styles.add,
              pressed && styles.pressed,
              disabled && styles.disabled,
            ]}
            onPress={() => void pickImages()}
          >
            <ImagePlus color={colors.primary} size={23} />
            <Text style={styles.addText}>{processing ? 'Đang xử lý…' : 'Thêm ảnh'}</Text>
          </Pressable>
        ) : null}
      </View>

      <Text style={styles.privacy}>
        App resize và tạo file JPEG mới trước upload để loại metadata EXIF/GPS.
      </Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {blocked ? (
        <Pressable style={styles.settings} onPress={() => void Linking.openSettings()}>
          <Settings color={colors.primary} size={15} />
          <Text style={styles.settingsText}>Mở Cài đặt</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  meta: { marginTop: 3, color: colors.inkMuted, fontSize: 11 },
  privateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  privateText: { color: colors.primary, fontSize: 10, fontWeight: '800' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  previewWrap: { position: 'relative' },
  preview: { width: 82, height: 82, borderRadius: radius.md, backgroundColor: colors.surfaceMuted },
  remove: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.ink,
  },
  add: {
    width: 100,
    height: 82,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  addText: { color: colors.primary, fontSize: 11, fontWeight: '800' },
  privacy: { marginTop: spacing.sm, color: colors.inkMuted, fontSize: 11, lineHeight: 16 },
  error: { marginTop: spacing.sm, color: colors.danger, fontSize: 12 },
  settings: { marginTop: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  settingsText: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.45 },
});
