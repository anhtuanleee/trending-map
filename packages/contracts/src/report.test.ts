import { describe, expect, it } from 'vitest';

import { submitReportInputSchema } from './report';

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
});
