import { z } from 'zod';

export const moderationStatusSchema = z.enum([
  'pending_review',
  'in_review',
  'approved',
  'rejected',
  'fact_checking',
  'legal_review',
  'removed',
]);

export const visibilityStatusSchema = z.enum(['public', 'labeled', 'limited', 'hidden']);

export const removalReasonSchema = z.enum([
  'false_information',
  'privacy_violation',
  'defamation',
  'dangerous_content',
  'incorrect_location',
  'copyright',
  'government_request',
  'court_order',
  'spam',
  'duplicate',
  'other',
]);

export const reportSourceTypeSchema = z.enum([
  'community_eyewitness',
  'photo_evidence',
  'video_evidence',
  'official_notice',
  'government_open_data',
  'news_report',
  'organization_statement',
  'other',
]);

export const sourceVerificationStatusSchema = z.enum([
  'unverified',
  'verified',
  'disputed',
  'revoked',
]);

export const publicReportSourceSchema = z.object({
  id: z.string().uuid(),
  type: reportSourceTypeSchema,
  title: z.string().nullable(),
  publisher: z.string().nullable(),
  author: z.string().nullable(),
  url: z.string().url().nullable(),
  publishedAt: z.string().datetime().nullable(),
  accessedAt: z.string().datetime().nullable(),
  verificationStatus: sourceVerificationStatusSchema,
  primary: z.boolean(),
});

export const contentFlagReasonSchema = z.enum([
  'false_information',
  'incorrect_location',
  'outdated',
  'privacy_violation',
  'defamation',
  'fake_official_source',
  'dangerous_content',
  'spam',
  'copyright',
  'other',
]);

export const contentFlagStatusSchema = z.enum(['open', 'in_review', 'resolved', 'dismissed']);

export const submitContentFlagInputSchema = z
  .object({
    reportId: z.string().uuid(),
    reason: contentFlagReasonSchema,
    description: z.string().trim().max(1000).optional(),
    idempotencyKey: z.string().uuid(),
  })
  .superRefine((value, context) => {
    if (value.reason === 'other' && !value.description) {
      context.addIssue({
        code: 'custom',
        path: ['description'],
        message: 'Cần mô tả vấn đề khi chọn lý do khác.',
      });
    }
  });

export const submitContentFlagResultSchema = z.object({
  id: z.string().uuid(),
  reportId: z.string().uuid(),
  status: z.literal('open'),
});

export type ModerationStatus = z.infer<typeof moderationStatusSchema>;
export type VisibilityStatus = z.infer<typeof visibilityStatusSchema>;
export type RemovalReason = z.infer<typeof removalReasonSchema>;
export type ReportSourceType = z.infer<typeof reportSourceTypeSchema>;
export type SourceVerificationStatus = z.infer<typeof sourceVerificationStatusSchema>;
export type PublicReportSource = z.infer<typeof publicReportSourceSchema>;
export type ContentFlagReason = z.infer<typeof contentFlagReasonSchema>;
export type ContentFlagStatus = z.infer<typeof contentFlagStatusSchema>;
export type SubmitContentFlagInput = z.infer<typeof submitContentFlagInputSchema>;
export type SubmitContentFlagResult = z.infer<typeof submitContentFlagResultSchema>;
