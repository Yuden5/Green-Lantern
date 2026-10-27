import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import useMapData from './useMapData.js';
import { fetchGrid, fetchZones } from '../api/data.js';

vi.mock('../api/data.js', () => ({ fetchZones: vi.fn(), fetchGrid: vi.fn() }));

const collection = (id) => ({ type: 'FeatureCollection', features: [{ type: 'Feature', geometry: null, properties: { id } }] });
const grid = { frameId: 'gisda_03', rows: 1, cols: 1, cellSizeM: 100, ndvi: [[0.4]] };

beforeEach(() => {
  vi.mocked(fetchZones).mockReset();
  vi.mocked(fetchGrid).mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useMapData', () => {
  it('loads both zone layers and the focus frame grid, then becomes ready', async () => {
    vi.mocked(fetchZones).mockImplementation(async (layer) => collection(layer));
    vi.mocked(fetchGrid).mockResolvedValue(grid);
    const { result } = renderHook(() => useMapData());
    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.green.features[0].properties.id).toBe('green');
    expect(result.current.grey.features[0].properties.id).toBe('grey');
    expect(result.current.grid).toEqual(grid);
    expect(fetchGrid).toHaveBeenCalledWith('gisda_03', expect.any(Object));
    expect(result.current.version).toBe(1);
  });

  it('reports an error, then loads again on reload', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(fetchZones).mockImplementation(async (layer) => collection(layer));
    vi.mocked(fetchGrid).mockRejectedValue(new Error('offline'));
    const { result } = renderHook(() => useMapData());
    await waitFor(() => expect(result.current.status).toBe('error'));

    vi.mocked(fetchGrid).mockResolvedValue(grid);
    act(() => result.current.reload());
    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current.status).toBe('ready'));
  });
});
