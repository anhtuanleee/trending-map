import { z } from 'zod';

import { operationalStatusSchema } from './report';

export const reportUpdateKindSchema = z.enum([
  'note',
  'status_change',
  'official_update',
  'evidence_added',
]);

export const reportTimelineItemSchema = z.object({
  id: z.string().uuid(),
  reportId: z.string().uuid(),
  kind: reportUpdateKindSchema,
  body: z.string().nullable(),
  operationalStatus: operationalStatusSchema.nullable(),
  official: z.boolean(),
  sourceLabel: z.string().nullable(),
  createdAt: z.string().datetime(),
});

export const reportTimelineSchema = z.array(reportTimelineItemSchema).max(100);

export const updateOperationalStatusSchema = z.enum(['active', 'resolving', 'resolved']);

export const addReportUpdateInputSchema = z
  .object({
    reportId: z.string().uuid(),
    kind: z.enum(['note', 'status_change']),
    body: z.string().trim().min(1).max(1000).optional(),
    operationalStatus: updateOperationalStatusSchema.optional(),
    idempotencyKey: z.string().uuid(),
  })
  .superRefine((value, context) => {
    if (value.kind === 'note' && !value.body) {
      context.addIssue({
        code: 'custom',
        path: ['body'],
        message: 'Cập nhật hiện trường cần nội dung.',
      });
    }

    if (value.kind === 'status_change' && !value.operationalStatus) {
      context.addIssue({
        code: 'custom',
        path: ['operationalStatus'],
        message: 'Cập nhật trạng thái cần trạng thái mới.',
      });
    }
  });

export const canUpdateReportResultSchema = z.object({ canUpdate: z.boolean() });

export const notificationEventTypeSchema = z.enum([
  'report_created',
  'report_updated',
  'report_status_changed',
  'official_alert',
  'event_reminder',
]);

export const notificationEventSchema = z.object({
  id: z.string().uuid(),
  type: notificationEventTypeSchema,
  aggregateType: z.enum(['report', 'followed_area', 'event']),
  aggregateId: z.string().uuid().nullable(),
  occurredAt: z.string().datetime(),
  data: z.record(z.string(), z.unknown()),
});

export const savedItemKindSchema = z.enum(['report', 'event']);

export const savedItemSchema = z.object({
  itemType: savedItemKindSchema,
  itemId: z.string().uuid(),
  reminderAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const featureRolloutKeySchema = z.enum([
  'live_incident_timeline',
  'photo_evidence_upload',
  'followed_area_push_alerts',
  'duplicate_report_merge',
  'local_pulse_feed',
  'event_save_reminder_share',
  'official_data_layers',
  'contributor_reputation',
]);

export const featureRolloutSchema = z.object({
  key: featureRolloutKeySchema,
  enabled: z.boolean(),
  config: z.record(z.string(), z.unknown()),
});

export const featureRolloutsSchema = z.array(featureRolloutSchema);

export type ReportUpdateKind = z.infer<typeof reportUpdateKindSchema>;
export type ReportTimelineItem = z.infer<typeof reportTimelineItemSchema>;
export type UpdateOperationalStatus = z.infer<typeof updateOperationalStatusSchema>;
export type AddReportUpdateInput = z.infer<typeof addReportUpdateInputSchema>;
export type CanUpdateReportResult = z.infer<typeof canUpdateReportResultSchema>;
export type NotificationEventType = z.infer<typeof notificationEventTypeSchema>;
export type NotificationEvent = z.infer<typeof notificationEventSchema>;
export type SavedItemKind = z.infer<typeof savedItemKindSchema>;
export type SavedItem = z.infer<typeof savedItemSchema>;
export type FeatureRolloutKey = z.infer<typeof featureRolloutKeySchema>;
export type FeatureRollout = z.infer<typeof featureRolloutSchema>;
