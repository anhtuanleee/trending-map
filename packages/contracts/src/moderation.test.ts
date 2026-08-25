import { describe, expect, it } from 'vitest';

import {
  moderateReportCaseInputSchema,
  moderateReportMediaInputSchema,
  reportMediaModerationItemSchema,
  reportModerationItemSchema,
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
});

describe('report moderation contracts', () => {
  it('accepts a queue item without reporter identity or trust internals', () => {
    const item = reportModerationItemSchema.parse({
      caseId: mediaId,
      reportId: '42a37a67-b480-4809-8658-97cfcbd34c63',
      type: 'incident',
      categoryName: 'Ngập nước',
      title: 'Ngập sâu trên đường Nguyễn Huệ',
      description: 'Nước đang lên nhanh và xe máy khó di chuyển.',
      addressLabel: 'Quận 1, TP.HCM',
      severity: 'high',
      verificationStatus: 'disputed',
      operationalStatus: 'active',
      confirmationCount: 5,
      notThereCount: 3,
      startsAt: '2026-08-25T03:00:00.000Z',
      expiresAt: '2026-08-25T09:00:00.000Z',
      createdAt: '2026-08-25T03:00:00.000Z',
      priority: 4,
      caseStatus: 'open',
      queueReason: 'community_disputed',
    });

    expect('createdBy' in item).toBe(false);
    expect('trustScoreInternal' in item).toBe(false);
  });

  it('requires a reason for resolve and reject but not approve', () => {
    const base = {
      caseId: mediaId,
      idempotencyKey: 'b4d16486-3422-4a26-b3b7-cefc0b73c21d',
    };

    expect(moderateReportCaseInputSchema.safeParse({ ...base, action: 'approve' }).success).toBe(
      true,
    );
    expect(moderateReportCaseInputSchema.safeParse({ ...base, action: 'resolve' }).success).toBe(
      false,
    );
    expect(moderateReportCaseInputSchema.safeParse({ ...base, action: 'reject' }).success).toBe(
      false,
    );
  });
});
