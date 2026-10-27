import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import Sidebar from './Sidebar.jsx';
import { classifyGrid } from '../../lib/grid.js';

const square = { type: 'Polygon', coordinates: [[[100.5, 13.7], [100.51, 13.7], [100.51, 13.71], [100.5, 13.71], [100.5, 13.7]]] };

const green = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: square,
      properties: {
        id: 'GZ-001',
        name: 'Open green land 1',
        nameTh: 'ที่โล่งสีเขียว 1',
        type: 'Open green land',
        district: 'Don Mueang',
        areaM2: 800000,
        populationNearby: 21000,
        nearbyRadiusKm: 1,
        ndvi: 0.62,
        tempInsideC: 31.2,
        tempAroundC: 35.8,
        updatedAt: '2026-10-15',
      },
    },
  ],
};

const greyZone = (id, rank, fitness, distanceKm = 4.7) => ({
  type: 'Feature',
  geometry: square,
  properties: {
    id,
    district: 'Don Mueang',
    areaM2: 12400,
    populationNearby: 38000,
    nearbyRadiusKm: 1,
    fitness,
    rank,
    scores: { greenAccessDeficit: 5, airProximity: 5, heatSeverity: 4 },
    penalty: 0,
    ndvi: 0.08,
    surfaceTempC: 37.4,
    nearestGreenZone: { id: 'GZ-010', name: 'Airfield grass 3', distanceKm },
    updatedAt: null,
  },
});

const grey = {
  type: 'FeatureCollection',
  features: [0.91, 0.84, 0.76, 0.71, 0.65, 0.58, 0.54, 0.41].map((fitness, i) =>
    greyZone(i === 0 ? 'G-001' : `G-00${i + 1}`, i + 1, fitness, i === 7 ? 0 : 4.7),
  ),
};

// 30 × 30 grid over the real gisda_03 frame: the top 10 rows are green, the rest grey (≈ a third green).
const grid = {
  frameId: 'gisda_03',
  rows: 30,
  cols: 30,
  cellSizeM: 100,
  ndvi: Array.from({ length: 30 }, (_, row) => Array(30).fill(row < 10 ? 0.6 : 0.1)),
};
const classified = classifyGrid(grid);

const renderSidebar = (props = {}) =>
  render(
    <Sidebar
      status="ready"
      green={green}
      grey={grey}
      classified={classified}
      grid={grid}
      selected={null}
      onClear={() => {}}
      onRetry={() => {}}
      {...props}
    />,
  );

describe('Sidebar', () => {
  it('shows the Don Mueang overview with the green share and areas in km²', () => {
    renderSidebar();
    expect(screen.getByRole('heading', { name: 'Don Mueang overview' })).toBeTruthy();
    expect(screen.getByText('33%')).toBeTruthy();
    expect(screen.getByText('8.978 km²')).toBeTruthy();
    expect(screen.getByText('37.14 km²')).toBeTruthy();
    expect(screen.getByText('High 3')).toBeTruthy();
  });

  it('lists the other GISTDA frames as "Update soon" with their areas', () => {
    renderSidebar();
    expect(screen.getAllByText('Update soon')).toHaveLength(2);
    expect(screen.getByText('9.024 km²')).toBeTruthy();
    expect(screen.getByText('8.957 km²')).toBeTruthy();
  });

  it('shows green zone stats with the area in km² and the math written out', () => {
    renderSidebar({ selected: { kind: 'green', id: 'GZ-001' } });
    expect(screen.getByRole('heading', { name: 'Open green land 1' })).toBeTruthy();
    expect(screen.getByText('38.1')).toBeTruthy();
    expect(screen.getByText('Meets target')).toBeTruthy();
    expect(screen.getByText('0.800 km²')).toBeTruthy();
    expect(screen.getByText('800,000 m² ÷ 21,000 people = 38.1 m² each')).toBeTruthy();
    expect(screen.getByText('4.6°C cooler than around it')).toBeTruthy();
    expect(screen.getByText('NDVI 0.62 · dense vegetation')).toBeTruthy();
  });

  it('shows grey zone fitness, rank, factors and area in km²', () => {
    renderSidebar({ selected: { kind: 'grey', id: 'G-001' } });
    expect(screen.getByRole('heading', { name: 'Site G-001' })).toBeTruthy();
    expect(screen.getByText('0.91')).toBeTruthy();
    expect(screen.getByText('High priority · rank 1 of 8')).toBeTruthy();
    expect(screen.getByText('Far from parks')).toBeTruthy();
    expect(screen.getByText('0.012 km²')).toBeTruthy();
    expect(screen.getByText('Greening it adds 0.33 m² per nearby person')).toBeTruthy();
    expect(screen.getByText('Airfield grass 3 · 4.7 km')).toBeTruthy();
  });

  it('says "next to it" when the nearest green zone is closer than 0.1 km', () => {
    renderSidebar({ selected: { kind: 'grey', id: 'G-008' } });
    expect(screen.getByText('Airfield grass 3 · next to it')).toBeTruthy();
  });

  it('falls back to the overview when the selected zone is not in the data', () => {
    renderSidebar({ selected: { kind: 'green', id: 'GZ-404' } });
    expect(screen.getByRole('heading', { name: 'Don Mueang overview' })).toBeTruthy();
  });

  it('calls onClear from the close button', () => {
    const onClear = vi.fn();
    renderSidebar({ selected: { kind: 'green', id: 'GZ-001' }, onClear });
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClear).toHaveBeenCalledOnce();
  });

  it('shows placeholder cards while loading', () => {
    renderSidebar({ status: 'loading', green: null, grey: null, classified: null, grid: null });
    expect(screen.getByLabelText('Loading zone data')).toBeTruthy();
  });

  it('shows an error with a working Retry button', () => {
    const onRetry = vi.fn();
    renderSidebar({ status: 'error', green: null, grey: null, classified: null, grid: null, onRetry });
    expect(screen.getByRole('alert').textContent).toContain("Couldn't load zone data");
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('says what failed, and does not blame a backend while it uses the example data', () => {
    const error = new Error('Loading ./assets/green-zones.geojson failed with HTTP 404.');
    renderSidebar({ status: 'error', error, green: null, grey: null, classified: null, grid: null });
    const alert = screen.getByRole('alert').textContent;
    expect(alert).toContain('Loading ./assets/green-zones.geojson failed with HTTP 404.');
    expect(alert).toContain('example data');
    expect(alert).not.toMatch(/backend/i);
  });
});
