import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchGrid, fetchZones, gridUrl, normalizeCollection, normalizeGrid, zonesUrl } from './data.js';

const square = [[[100.5, 13.7], [100.51, 13.7], [100.51, 13.71], [100.5, 13.71], [100.5, 13.7]]];
const feature = (properties) => ({ type: 'Feature', geometry: { type: 'Polygon', coordinates: square }, properties });
const collection = (...features) => ({ type: 'FeatureCollection', features });
const respondWith = (json, status = 200) =>
  vi.fn().mockResolvedValue({ ok: status >= 200 && status < 300, status, json: async () => json });

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('urls', () => {
  it('use the example files bundled with the app when no backend URL is set', () => {
    expect(zonesUrl('green', '')).toMatch(/mock\/green-zones\.geojson$/);
    expect(zonesUrl('grey', '')).toMatch(/mock\/grey-zones\.geojson$/);
    expect(gridUrl('gisda_03', '')).toMatch(/mock\/grids\/gisda_03\.json$/);
  });

  it('never point the example files at the site root, so the app works in any folder', () => {
    for (const url of [zonesUrl('green', ''), zonesUrl('grey', ''), gridUrl('gisda_03', '')]) {
      expect(url).not.toMatch(/^\/mock\//);
    }
  });

  it('name the frame when it has no example grid', () => {
    expect(() => gridUrl('gisda_99', '')).toThrow(/gisda_99/);
  });

  it('use the backend endpoints when a base URL is set', () => {
    expect(zonesUrl('green', 'http://localhost:8000/api')).toBe('http://localhost:8000/api/green-zones');
    expect(zonesUrl('grey', 'http://localhost:8000/api')).toBe('http://localhost:8000/api/grey-zones');
    expect(gridUrl('gisda_03', 'http://localhost:8000/api')).toBe('http://localhost:8000/api/frames/gisda_03/grid');
  });
});

describe('normalizeCollection', () => {
  it('rejects data that is not a FeatureCollection', () => {
    expect(() => normalizeCollection({ type: 'Feature' }, 'green')).toThrow(/FeatureCollection/);
    expect(() => normalizeCollection(null, 'grey')).toThrow(/FeatureCollection/);
  });

  it('drops features without an id or polygon geometry', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const point = { type: 'Feature', geometry: { type: 'Point', coordinates: [100, 13] }, properties: { id: 'P' } };
    const result = normalizeCollection(collection(feature({ id: 'GZ-1', name: 'A' }), feature({ name: 'no id' }), point), 'green');
    expect(result.features.map((f) => f.properties.id)).toEqual(['GZ-1']);
    expect(console.warn).toHaveBeenCalledTimes(2);
  });

  it('turns bad numbers into null and fills in defaults', () => {
    const result = normalizeCollection(collection(feature({ id: 7, name: 'B', areaM2: 'big', populationNearby: Infinity })), 'green');
    const p = result.features[0].properties;
    expect(p.id).toBe('7');
    expect(p.areaM2).toBeNull();
    expect(p.populationNearby).toBeNull();
    expect(p.nearbyRadiusKm).toBe(1);
    expect(p.type).toBe('Green zone');
  });

  it('normalizes grey zone scores, penalty and nearest green zone', () => {
    const result = normalizeCollection(
      collection(
        feature({
          id: 'G-001',
          fitness: 0.78,
          rank: 1,
          scores: { greenAccessDeficit: 4, airProximity: 4, heatSeverity: 5 },
          nearestGreenZone: { id: 'GZ-004', name: 'Airfield grass 1', distanceKm: 0.2 },
        }),
      ),
      'grey',
    );
    const p = result.features[0].properties;
    expect(p.scores).toEqual({ greenAccessDeficit: 4, airProximity: 4, heatSeverity: 5 });
    expect(p.penalty).toBe(0);
    expect(p.nearestGreenZone).toEqual({ id: 'GZ-004', name: 'Airfield grass 1', distanceKm: 0.2 });
  });
});

describe('normalizeGrid', () => {
  it('accepts rows × cols NDVI values and turns bad values into null', () => {
    const grid = normalizeGrid({ rows: 2, cols: 2, cellSizeM: 100, ndvi: [[0.5, 'x'], [0.1]] }, 'gisda_03');
    expect(grid).toEqual({ frameId: 'gisda_03', rows: 2, cols: 2, cellSizeM: 100, ndvi: [[0.5, null], [0.1, null]] });
  });

  it('rejects a grid without rows and cols, or with the wrong number of rows', () => {
    expect(() => normalizeGrid({ rows: 3, cols: 2, ndvi: [[0.5, 0.1]] }, 'gisda_03')).toThrow(/rows/);
    expect(() => normalizeGrid(null, 'gisda_03')).toThrow(/rows/);
  });
});

describe('fetching', () => {
  it('fetches and normalizes a zone layer', async () => {
    const fetchMock = respondWith(collection(feature({ id: 'GZ-1', name: 'A' })));
    vi.stubGlobal('fetch', fetchMock);
    const result = await fetchZones('green', { baseUrl: '' });
    expect(fetchMock).toHaveBeenCalledWith(zonesUrl('green', ''), expect.any(Object));
    expect(result.features).toHaveLength(1);
  });

  it('fetches and normalizes an NDVI grid', async () => {
    const fetchMock = respondWith({ rows: 1, cols: 2, ndvi: [[0.2, 0.6]] });
    vi.stubGlobal('fetch', fetchMock);
    const grid = await fetchGrid('gisda_03', { baseUrl: 'http://api' });
    expect(fetchMock).toHaveBeenCalledWith('http://api/frames/gisda_03/grid', expect.any(Object));
    expect(grid.ndvi).toEqual([[0.2, 0.6]]);
  });

  it('throws on a non-2xx response', async () => {
    vi.stubGlobal('fetch', respondWith({}, 503));
    await expect(fetchZones('grey', { baseUrl: 'http://api' })).rejects.toThrow(/HTTP 503/);
    await expect(fetchGrid('gisda_03', { baseUrl: 'http://api' })).rejects.toThrow(/HTTP 503/);
  });

  it('names the address when the request itself fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(fetchZones('grey', { baseUrl: 'http://api' })).rejects.toThrow(/http:\/\/api\/grey-zones.*Failed to fetch/);
  });

  it('names the address when the answer is not JSON (for example a web page)', async () => {
    const notJson = async () => {
      throw new SyntaxError("Unexpected token '<'");
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: notJson }));
    await expect(fetchZones('green', { baseUrl: 'http://api' })).rejects.toThrow(/http:\/\/api\/green-zones.*not JSON/);
  });
});
