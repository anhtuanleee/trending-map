import { z } from 'zod';

export const reportTypeSchema = z.enum(['incident', 'scheduled_event', 'area_alert']);
export const severitySchema = z.enum(['info', 'low', 'medium', 'high', 'critical']);
export const verificationStatusSchema = z.enum([
  'unverified',
  'community_verified',
  'official_verified',
  'disputed',
]);
export const operationalStatusSchema = z.enum([
  'active',
  'monitoring',
  'resolved',
  'expired',
  'rejected',
]);

export const coordinateSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const mapItemSchema = z.object({
  id: z.string().uuid(),
  type: reportTypeSchema,
  categorySlug: z.string(),
  categoryName: z.string(),
  title: z.string(),
  coordinate: coordinateSchema,
  severity: severitySchema,
  verificationStatus: verificationStatusSchema,
  operationalStatus: operationalStatusSchema,
  startsAt: z.string().datetime(),
  expiresAt: z.string().datetime().nullable(),
  confirmationCount: z.number().int().nonnegative(),
  distanceMeters: z.number().nonnegative().nullable().optional(),
});

export const reportDetailSchema = mapItemSchema.extend({
  description: z.string(),
  addressLabel: z.string().nullable(),
  sourceLabel: z.string().nullable(),
  mediaUrls: z.array(z.string().url()),
  createdAt: z.string().datetime(),
});

export const submitReportInputSchema = z
  .object({
    type: reportTypeSchema,
    categoryId: z.string().uuid(),
    title: z.string().trim().min(6).max(120),
    description: z.string().trim().min(12).max(1200),
    severity: severitySchema,
    coordinate: coordinateSchema,
    addressLabel: z.string().trim().max(240).optional(),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime().optional(),
    anonymousPublicly: z.boolean(),
    idempotencyKey: z.string().uuid(),
  })
  .superRefine((value, context) => {
    if (value.type === 'scheduled_event' && !value.endsAt) {
      context.addIssue({
        code: 'custom',
        path: ['endsAt'],
        message: 'Sự kiện có lịch cần thời gian kết thúc.',
      });
    }
  });

export const confirmationInputSchema = z.object({
  reportId: z.string().uuid(),
  kind: z.enum(['seen', 'not_there', 'incorrect']),
  coordinate: coordinateSchema.optional(),
  idempotencyKey: z.string().uuid(),
});

export const submitReportResultSchema = z.object({
  id: z.string().uuid(),
  status: z.literal('unverified'),
});

export const confirmationResultSchema = z.object({
  reportId: z.string().uuid(),
  accepted: z.boolean(),
});

export type ReportType = z.infer<typeof reportTypeSchema>;
export type Severity = z.infer<typeof severitySchema>;
export type VerificationStatus = z.infer<typeof verificationStatusSchema>;
export type OperationalStatus = z.infer<typeof operationalStatusSchema>;
export type Coordinate = z.infer<typeof coordinateSchema>;
export type MapItem = z.infer<typeof mapItemSchema>;
export type ReportDetail = z.infer<typeof reportDetailSchema>;
export type SubmitReportInput = z.infer<typeof submitReportInputSchema>;
export type ConfirmationInput = z.infer<typeof confirmationInputSchema>;
export type SubmitReportResult = z.infer<typeof submitReportResultSchema>;
export type ConfirmationResult = z.infer<typeof confirmationResultSchema>;
