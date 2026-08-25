import type { LocalReportImage } from '@trending-map/contracts';
import * as Crypto from 'expo-crypto';
import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

const maxDimension = 1600;
const maxSourceBytes = 20_000_000;

export async function sanitizeReportImage(input: {
  uri: string;
  width: number;
  height: number;
  fileSize?: number | null;
}): Promise<LocalReportImage> {
  if (input.fileSize && input.fileSize > maxSourceBytes) {
    throw new Error('source_image_too_large');
  }

  const context = ImageManipulator.manipulate(input.uri);
  try {
    if (Math.max(input.width, input.height) > maxDimension) {
      if (input.width >= input.height) context.resize({ width: maxDimension, height: null });
      else context.resize({ width: null, height: maxDimension });
    }

    const rendered = await context.renderAsync();
    try {
      const saved = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.82 });
      const file = new File(saved.uri);

      if (!file.exists || !file.size || file.size > 5_000_000) {
        throw new Error('sanitized_image_too_large');
      }

      return {
        idempotencyKey: Crypto.randomUUID(),
        uri: saved.uri,
        width: saved.width,
        height: saved.height,
        mimeType: 'image/jpeg',
        fileSizeBytes: file.size,
      };
    } finally {
      rendered.release();
    }
  } finally {
    context.release();
  }
}
