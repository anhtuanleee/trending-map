import { z } from 'zod';

export const mapBoundsSchema = z.object({
  west: z.number().min(-180).max(180),
  south: z.number().min(-90).max(90),
  east: z.number().min(-180).max(180),
  north: z.number().min(-90).max(90),
});

export const getMapItemsInputSchema = z.object({
  bounds: mapBoundsSchema,
  categorySlugs: z.array(z.string()).max(20).default([]),
  zoom: z.number().min(0).max(24),
});

export type MapBounds = z.infer<typeof mapBoundsSchema>;
export type GetMapItemsInput = z.infer<typeof getMapItemsInputSchema>;
