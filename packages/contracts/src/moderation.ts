import { z } from 'zod';

import {
  operationalStatusSchema,
  reportTypeSchema,
  severitySchema,
  verificationStatusSchema,
} from './report';

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

export const reportModerationItemSchema = z.object({
  caseId: z.string().uuid(),
  reportId: z.string().uuid(),
  type: reportTypeSchema,
  categoryName: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  addressLabel: z.string().nullable(),
  severity: severitySchema,
  verificationStatus: verificationStatusSchema,
  operationalStatus: operationalStatusSchema,
  confirmationCount: z.number().int().nonnegative(),
  notThereCount: z.number().int().nonnegative(),
  startsAt: z.string().datetime(),
  expiresAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  priority: z.number().int().min(0).max(5),
  caseStatus: z.enum(['open', 'in_review']),
  queueReason: z.string().nullable(),
});

export const reportModerationQueueSchema = z.array(reportModerationItemSchema).max(100);

export const moderateReportCaseInputSchema = z
  .object({
    caseId: z.string().uuid(),
    action: z.enum(['approve', 'resolve', 'reject']),
    reason: z.string().trim().max(500).optional(),
    idempotencyKey: z.string().uuid(),
  })
  .superRefine((value, context) => {
    if (value.action !== 'approve' && !value.reason) {
      context.addIssue({
        code: 'custom',
        path: ['reason'],
        message: 'Cần nhập lý do khi resolve hoặc reject báo cáo.',
      });
    }
  });

export const moderateReportCaseResultSchema = z.object({
  caseId: z.string().uuid(),
  reportId: z.string().uuid(),
  action: z.enum(['approve', 'resolve', 'reject']),
  caseStatus: z.literal('resolved'),
  verificationStatus: verificationStatusSchema,
  operationalStatus: operationalStatusSchema,
});

export type ReportModerationItem = z.infer<typeof reportModerationItemSchema>;
export type ModerateReportCaseInput = z.infer<typeof moderateReportCaseInputSchema>;
export type ModerateReportCaseResult = z.infer<typeof moderateReportCaseResultSchema>;
