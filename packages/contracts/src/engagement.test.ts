import { describe, expect, it } from 'vitest';

import {
  addReportUpdateInputSchema,
  featureRolloutsSchema,
  notificationEventSchema,
  localReportImageSchema,
  prepareReportMediaUploadInputSchema,
  prepareReportMediaUploadResultSchema,
  reportTimelineItemSchema,
  savedItemSchema,
} from './engagement';

describe('engagement contracts', () => {
  it('keeps public timeline items free of reporter identity', () => {
    const item = reportTimelineItemSchema.parse({
      id: '9f925a58-dae8-41ae-a87f-2754f68e5bbb',
      reportId: '5c0fae3d-83d8-4b49-9228-54862b7dc06f',
      kind: 'status_change',
      body: 'Khu vực đang được xử lý.',
      operationalStatus: 'resolving',
      official: false,
      sourceLabel: null,
      createdAt: '2026-08-25T04:00:00.000Z',
      createdBy: 'should-be-stripped',
      trustScoreInternal: 92,
    });

    expect(item).not.toHaveProperty('createdBy');
    expect(item).not.toHaveProperty('trustScoreInternal');
  });

  it('defaults every declared rollout to an explicit server response', () => {
    const rollouts = featureRolloutsSchema.parse([
      { key: 'live_incident_timeline', enabled: false, config: {} },
      { key: 'photo_evidence_upload', enabled: false, config: { maxImages: 3 } },
    ]);

    expect(rollouts.every((rollout) => !rollout.enabled)).toBe(true);
  });

  it('validates saved items and notification events', () => {
    expect(
      savedItemSchema.parse({
        itemType: 'event',
        itemId: '1c3fdb6f-a54f-41be-acbc-0e2f5a24df6f',
        reminderAt: null,
        createdAt: '2026-08-25T04:00:00.000Z',
        updatedAt: '2026-08-25T04:00:00.000Z',
      }).itemType,
    ).toBe('event');

    expect(
      notificationEventSchema.parse({
        id: '709f62b2-474d-491a-8f9e-b36e64243c88',
        type: 'official_alert',
        aggregateType: 'report',
        aggregateId: '5c0fae3d-83d8-4b49-9228-54862b7dc06f',
        occurredAt: '2026-08-25T04:00:00.000Z',
        data: { severity: 'critical' },
      }).type,
    ).toBe('official_alert');
  });

  it('requires content for notes and a safe lifecycle target for status changes', () => {
    const base = {
      reportId: '5c0fae3d-83d8-4b49-9228-54862b7dc06f',
      idempotencyKey: '40234c66-a54f-4c33-98e9-e16dfa2a0d59',
    };

    expect(addReportUpdateInputSchema.safeParse({ ...base, kind: 'note' }).success).toBe(false);
    expect(
      addReportUpdateInputSchema.safeParse({
        ...base,
        kind: 'status_change',
        operationalStatus: 'resolved',
      }).success,
    ).toBe(true);
    expect(
      addReportUpdateInputSchema.safeParse({
        ...base,
        kind: 'status_change',
        operationalStatus: 'rejected',
      }).success,
    ).toBe(false);
  });

  it('accepts only sanitized bounded JPEG evidence', () => {
    const image = {
      idempotencyKey: '7a01ec55-a262-4b18-a812-544f63717120',
      uri: 'file:///cache/evidence.jpg',
      width: 1200,
      height: 900,
      mimeType: 'image/jpeg',
      fileSizeBytes: 420_000,
    } as const;

    expect(localReportImageSchema.safeParse(image).success).toBe(true);
    expect(
      prepareReportMediaUploadInputSchema.safeParse({
        ...image,
        reportId: '5c0fae3d-83d8-4b49-9228-54862b7dc06f',
        idempotencyKey: '7a01ec55-a262-4b18-a812-544f63717120',
        mimeType: 'image/png',
      }).success,
    ).toBe(false);
    expect(localReportImageSchema.safeParse({ ...image, fileSizeBytes: 5_000_001 }).success).toBe(
      false,
    );
    expect(
      prepareReportMediaUploadResultSchema.safeParse({
        mediaId: '5c0fae3d-83d8-4b49-9228-54862b7dc06f',
        uploadRequired: false,
      }).success,
    ).toBe(true);
    expect(
      prepareReportMediaUploadResultSchema.safeParse({
        mediaId: '5c0fae3d-83d8-4b49-9228-54862b7dc06f',
        uploadRequired: true,
      }).success,
    ).toBe(false);
  });
});
