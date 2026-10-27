import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeCollection, normalizeGrid } from './data.js';

// Plain path maths on purpose: Vite rewrites `new URL(`…${x}`, import.meta.url)` into an asset lookup.
const MOCK_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../mock');
const load = (file) => JSON.parse(readFileSync(path.join(MOCK_DIR, file), 'utf8'));

const REQUIRED = {
  green: ['id', 'name', 'district', 'areaM2', 'populationNearby'],
  grey: ['id', 'district', 'areaM2', 'populationNearby', 'fitness', 'rank'],
};

describe.each([
  ['green', 'green-zones.geojson'],
  ['grey', 'grey-zones.geojson'],
])('mock %s zones follow docs/API.md', (layer, file) => {
  const raw = load(file);
  const { features } = normalizeCollection(raw, layer);

  it('keeps every feature (all have an id and polygon geometry)', () => {
    expect(features.length).toBeGreaterThan(0);
    expect(features.length).toBe(raw.features.length);
  });

  it('has every required field', () => {
    for (const { properties } of features) {
      for (const key of REQUIRED[layer]) {
        expect(properties[key], `${properties.id}.${key}`).not.toBeNull();
      }
    }
  });

  it('has unique ids', () => {
    const ids = features.map((f) => f.properties.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('mock grey zones', () => {
  const { features } = normalizeCollection(load('grey-zones.geojson'), 'grey');

  it('has ranks 1..N, fitness 0–1 and integer scores 1–5', () => {
    const ranks = features.map((f) => f.properties.rank).sort((a, b) => a - b);
    expect(ranks).toEqual(features.map((_, i) => i + 1));
    for (const { properties: p } of features) {
      expect(p.fitness).toBeGreaterThanOrEqual(0);
      expect(p.fitness).toBeLessThanOrEqual(1);
      for (const score of Object.values(p.scores)) {
        expect(Number.isInteger(score) && score >= 1 && score <= 5).toBe(true);
      }
    }
  });
});

describe('mock NDVI grid of gisda_03', () => {
  const grid = normalizeGrid(load('grids/gisda_03.json'), 'gisda_03');

  it('is 600 × 600 cells of 5 m with every NDVI value between -1 and 1', () => {
    expect([grid.rows, grid.cols, grid.cellSizeM]).toEqual([600, 600, 5]);
    const values = grid.ndvi.flat();
    expect(values).toHaveLength(360000);
    expect(values.every((v) => v !== null && v >= -1 && v <= 1)).toBe(true);
  });
});
