import {
  completeReportMediaUploadResultSchema,
  prepareReportMediaUploadResultSchema,
  type LocalReportImage,
} from '@trending-map/contracts';
import * as Crypto from 'expo-crypto';
import { File } from 'expo-file-system';

import { supabase } from '@/lib/supabase/client';

export async function uploadReportEvidenceImage(reportId: string, image: LocalReportImage) {
  if (!supabase) {
    await new Promise((resolve) => setTimeout(resolve, 250));
    return { mediaId: image.idempotencyKey, status: 'uploaded' as const };
  }

  const preparedResponse = await supabase.functions.invoke('create-report-media-upload', {
    body: {
      reportId,
      mimeType: image.mimeType,
      width: image.width,
      height: image.height,
      fileSizeBytes: image.fileSizeBytes,
      idempotencyKey: image.idempotencyKey,
    },
  });
  if (preparedResponse.error) throw preparedResponse.error;
  const prepared = prepareReportMediaUploadResultSchema.parse(preparedResponse.data);

  if (prepared.uploadRequired) {
    const bytes = await new File(image.uri).arrayBuffer();
    const uploaded = await supabase.storage
      .from(prepared.bucket)
      .uploadToSignedUrl(prepared.path, prepared.token, bytes, {
        contentType: image.mimeType,
        upsert: false,
      });
    if (uploaded.error) throw uploaded.error;
  }

  const completedResponse = await supabase.functions.invoke('complete-report-media-upload', {
    body: { mediaId: prepared.mediaId, idempotencyKey: Crypto.randomUUID() },
  });
  if (completedResponse.error) throw completedResponse.error;
  return completeReportMediaUploadResultSchema.parse(completedResponse.data);
}
