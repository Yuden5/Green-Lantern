import { describe, it, expect } from 'vitest';
import { FRAMES } from '../data/frames.js';
import { frameCenter, frameRing, maskPolygon, pointInFrame, polygonAreaM2, ringAreaM2 } from './geo.js';

const frame = (id) => FRAMES.find((f) => f.id === id);
const square = (lng, lat, size) => [[lng, lat], [lng + size, lat], [lng + size, lat + size], [lng, lat + size], [lng, lat]];

describe('frame geometry', () => {
  const { corners } = frame('gisda_03');

  it('maps (u, v) = (0, 0) to the top-left corner and (1, 1) to the bottom-right, as [lng, lat]', () => {
    expect(pointInFrame(corners, 0, 0)).toEqual([100.5798814, 13.9354055]);
    expect(pointInFrame(corners, 1, 1)).toEqual([100.60734273, 13.90820126]);
  });

  it('builds a closed ring: top-left, bottom-left, bottom-right, top-right', () => {
    const ring = frameRing(corners);
    expect(ring).toHaveLength(5);
    expect(ring[4]).toEqual(ring[0]);
    expect(ring[1]).toEqual([100.57964238, 13.90838144]);
    expect(ring[3]).toEqual([100.6075171, 13.9352513]);
  });

  it('finds the center as [lat, lng]', () => {
    const [lat, lng] = frameCenter(corners);
    expect(lat).toBeCloseTo(13.92181, 5);
    expect(lng).toBeCloseTo(100.5936, 4);
  });
});

describe('areas', () => {
  it('matches the reference areas of the three GISTDA frames (km²)', () => {
    const km2 = (id) => ringAreaM2(frameRing(frame(id).corners)) / 1e6;
    expect(km2('gisda_01')).toBeCloseTo(9.024, 3);
    expect(km2('gisda_02')).toBeCloseTo(8.957, 3);
    expect(km2('gisda_03')).toBeCloseTo(8.978, 3);
  });

  it('subtracts holes, adds MultiPolygon parts and ignores other geometry', () => {
    const outer = square(100, 13, 0.02);
    const hole = square(100.005, 13.005, 0.01);
    expect(polygonAreaM2({ type: 'Polygon', coordinates: [outer, hole] })).toBeCloseTo(ringAreaM2(outer) - ringAreaM2(hole), 3);
    expect(polygonAreaM2({ type: 'MultiPolygon', coordinates: [[outer], [hole]] })).toBeCloseTo(ringAreaM2(outer) + ringAreaM2(hole), 3);
    expect(polygonAreaM2({ type: 'Point', coordinates: [100, 13] })).toBe(0);
    expect(polygonAreaM2(null)).toBe(0);
  });
});

describe('maskPolygon', () => {
  it('cuts the focus area out of a big box', () => {
    const focus = { type: 'Polygon', coordinates: [square(100.5, 13.8, 0.1)] };
    const mask = maskPolygon(focus, [99, 12, 102, 15]);
    expect(mask.type).toBe('Polygon');
    expect(mask.coordinates[0]).toEqual([[99, 12], [102, 12], [102, 15], [99, 15], [99, 12]]);
    expect(mask.coordinates[1]).toEqual(focus.coordinates[0]);
  });
});
