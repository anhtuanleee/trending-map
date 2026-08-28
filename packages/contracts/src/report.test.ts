import { describe, expect, it } from 'vitest';

import {
  confirmationResultSchema,
  mapItemSchema,
  submitReportInputSchema,
  submitReportResultSchema,
} from './report';

const baseInput = {
  type: 'incident',
  categoryId: '24beceab-c7c1-407d-a0ab-b32ac358e4ec',
  title: 'Ngập sâu trên đường Nguyễn Huệ',
  description: 'Nước đang dâng cao, xe máy di chuyển rất khó khăn.',
  severity: 'high',
  coordinate: { latitude: 10.773, longitude: 106.704 },
  startsAt: '2026-08-24T03:00:00.000Z',
  anonymousPublicly: false,
  idempotencyKey: 'b4d16486-3422-4a26-b3b7-cefc0b73c21d',
} as const;

describe('submitReportInputSchema', () => {
  it('accepts a valid incident', () => {
    expect(submitReportInputSchema.safeParse(baseInput).success).toBe(true);
  });

  it('requires an end time for scheduled events', () => {
    const result = submitReportInputSchema.safeParse({
      ...baseInput,
      type: 'scheduled_event',
    });

    expect(result.success).toBe(false);
  });

  it('accepts public map distance without reporter identity', () => {
    const result = mapItemSchema.parse({
      id: '2e130699-a737-4942-bf43-f9f217bdf84b',
      type: 'incident',
      categorySlug: 'flood',
      categoryName: 'Ngập nước',
      title: 'Ngập sâu trên đường Nguyễn Huệ',
      coordinate: { latitude: 10.7731, longitude: 106.7034 },
      severity: 'high',
      verificationStatus: 'community_verified',
      operationalStatus: 'active',
      moderationStatus: 'pending_review',
      visibilityStatus: 'labeled',
      startsAt: '2026-08-24T03:24:00.000Z',
      expiresAt: null,
      confirmationCount: 14,
      distanceMeters: 248.5,
    });

    expect(result.distanceMeters).toBe(248.5);
    expect('createdBy' in result).toBe(false);
  });

  it('validates report command results', () => {
    expect(
      submitReportResultSchema.parse({
        id: '2e130699-a737-4942-bf43-f9f217bdf84b',
        status: 'unverified',
      }),
    ).toEqual({
      id: '2e130699-a737-4942-bf43-f9f217bdf84b',
      status: 'unverified',
    });
    expect(
      confirmationResultSchema.parse({
        reportId: '2e130699-a737-4942-bf43-f9f217bdf84b',
        accepted: true,
      }),
    ).toEqual({
      reportId: '2e130699-a737-4942-bf43-f9f217bdf84b',
      accepted: true,
    });
  });
});
