import { describe, expect, it } from 'vitest';

import { mapReportsRequestSchema } from './map';

const bounds = {
  west: 106.63,
  south: 10.72,
  east: 106.76,
  north: 10.84,
};

describe('mapReportsRequestSchema', () => {
  it('applies safe defaults for viewport reads', () => {
    const result = mapReportsRequestSchema.parse({ bounds });

    expect(result).toEqual({ bounds, categorySlugs: [], center: null, radiusMeters: null });
  });

  it('accepts a bounded nearby query', () => {
    const result = mapReportsRequestSchema.safeParse({
      bounds,
      categorySlugs: ['flood'],
      center: { latitude: 10.776, longitude: 106.701 },
      radiusMeters: 5_000,
    });

    expect(result.success).toBe(true);
  });

  it('rejects an excessively broad radius', () => {
    const result = mapReportsRequestSchema.safeParse({ bounds, radiusMeters: 100_000 });

    expect(result.success).toBe(false);
  });
});
