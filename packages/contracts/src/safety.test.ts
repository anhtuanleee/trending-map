import { describe, expect, it } from 'vitest';

import { publicReportSourceSchema, submitContentFlagInputSchema } from './safety';

describe('content safety contracts', () => {
  it('accepts a structured public source without internal identity', () => {
    const source = publicReportSourceSchema.parse({
      id: '5e4522fb-bdf7-457a-b323-d8cc301f3927',
      type: 'official_notice',
      title: 'Thông báo ngập cục bộ',
      publisher: 'Cơ quan vận hành đô thị',
      author: null,
      url: 'https://example.gov.vn/notices/123',
      publishedAt: '2026-08-28T03:00:00.000Z',
      accessedAt: '2026-08-28T03:05:00.000Z',
      verificationStatus: 'verified',
      primary: true,
    });

    expect(source.verificationStatus).toBe('verified');
    expect('submittedBy' in source).toBe(false);
  });

  it('requires context when a user selects the other reason', () => {
    const result = submitContentFlagInputSchema.safeParse({
      reportId: '2e130699-a737-4942-bf43-f9f217bdf84b',
      reason: 'other',
      idempotencyKey: 'b4d16486-3422-4a26-b3b7-cefc0b73c21d',
    });

    expect(result.success).toBe(false);
  });
});
