import { describe, expect, it } from 'vitest';

import {
  moderateReportMediaInputSchema,
  reportMediaModerationItemSchema,
  reportViolationInputSchema,
} from './moderation';

const mediaId = '2e130699-a737-4942-bf43-f9f217bdf84b';

describe('media moderation contracts', () => {
  it('accepts a client-safe queue item', () => {
    const item = reportMediaModerationItemSchema.parse({
      mediaId,
      reportId: '42a37a67-b480-4809-8658-97cfcbd34c63',
      reportTitle: 'Ngập sâu trên đường Nguyễn Huệ',
      categoryName: 'Ngập nước',
      addressLabel: 'Quận 1',
      severity: 'high',
      mimeType: 'image/jpeg',
      width: 1280,
      height: 960,
      fileSizeBytes: 420_000,
      uploadedAt: '2026-08-25T03:00:00.000Z',
      status: 'uploaded',
      previewUrl: 'https://example.supabase.co/storage/v1/object/sign/private/photo.jpg?token=x',
    });

    expect(item.mediaId).toBe(mediaId);
    expect('createdBy' in item).toBe(false);
    expect('storagePath' in item).toBe(false);
  });

  it('requires a reason when rejecting', () => {
    expect(
      moderateReportMediaInputSchema.safeParse({
        mediaId,
        decision: 'reject',
        idempotencyKey: 'b4d16486-3422-4a26-b3b7-cefc0b73c21d',
      }).success,
    ).toBe(false);
  });

  it('allows approval without a reason', () => {
    expect(
      moderateReportMediaInputSchema.safeParse({
        mediaId,
        decision: 'approve',
        idempotencyKey: 'b4d16486-3422-4a26-b3b7-cefc0b73c21d',
      }).success,
    ).toBe(true);
  });

  it('validates user violation reporting input', () => {
    const reportId = '42a37a67-b480-4809-8658-97cfcbd34c63';
    const parsed = reportViolationInputSchema.safeParse({
      reportId,
      reason: 'false_information',
      details: 'Vị trí này không có ngập nước thực tế',
      idempotencyKey: 'b4d16486-3422-4a26-b3b7-cefc0b73c21d',
    });
    expect(parsed.success).toBe(true);
  });
});
