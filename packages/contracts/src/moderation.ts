import { z } from 'zod';

import { severitySchema } from './report';

export const reportMediaModerationStatusSchema = z.enum(['uploaded', 'processing']);

export const reportMediaModerationItemSchema = z.object({
  mediaId: z.string().uuid(),
  reportId: z.string().uuid(),
  reportTitle: z.string().min(1),
  categoryName: z.string().min(1),
  addressLabel: z.string().nullable(),
  severity: severitySchema,
  mimeType: z.literal('image/jpeg'),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  fileSizeBytes: z.number().int().positive(),
  uploadedAt: z.string().datetime(),
  status: reportMediaModerationStatusSchema,
  previewUrl: z.string().url(),
});

export const reportMediaModerationQueueSchema = z.array(reportMediaModerationItemSchema).max(100);

export const moderateReportMediaInputSchema = z
  .object({
    mediaId: z.string().uuid(),
    decision: z.enum(['approve', 'reject']),
    reason: z.string().trim().max(500).optional(),
    idempotencyKey: z.string().uuid(),
  })
  .superRefine((value, context) => {
    if (value.decision === 'reject' && !value.reason) {
      context.addIssue({
        code: 'custom',
        path: ['reason'],
        message: 'Cần nhập lý do khi từ chối ảnh.',
      });
    }
  });

export const moderateReportMediaResultSchema = z.object({
  mediaId: z.string().uuid(),
  status: z.enum(['approved', 'rejected']),
  publicUrl: z.string().url().nullable(),
});

export type ReportMediaModerationItem = z.infer<typeof reportMediaModerationItemSchema>;
export type ModerateReportMediaInput = z.infer<typeof moderateReportMediaInputSchema>;
export type ModerateReportMediaResult = z.infer<typeof moderateReportMediaResultSchema>;
