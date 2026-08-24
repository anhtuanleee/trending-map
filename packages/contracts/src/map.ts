import { z } from 'zod';

import { coordinateSchema } from './report';

export const mapBoundsSchema = z.object({
  west: z.number().min(-180).max(180),
  south: z.number().min(-90).max(90),
  east: z.number().min(-180).max(180),
  north: z.number().min(-90).max(90),
});

export const mapReportsRequestSchema = z.object({
  bounds: mapBoundsSchema,
  categorySlugs: z.array(z.string()).max(20).default([]),
  center: coordinateSchema.nullable().default(null),
  radiusMeters: z.number().positive().max(50_000).nullable().default(null),
});

export const getMapItemsInputSchema = mapReportsRequestSchema.extend({
  zoom: z.number().min(0).max(24),
});

export type MapBounds = z.infer<typeof mapBoundsSchema>;
export type MapReportsRequest = z.infer<typeof mapReportsRequestSchema>;
export type GetMapItemsInput = z.infer<typeof getMapItemsInputSchema>;
