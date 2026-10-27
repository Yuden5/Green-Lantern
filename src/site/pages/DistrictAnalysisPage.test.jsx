import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import DistrictAnalysisPage from './DistrictAnalysisPage.jsx';

vi.mock('react-leaflet', async () => {
  const React = await import('react');
  const map = { fitBounds: vi.fn() };

  return {
    MapContainer: ({ children }) => React.createElement('div', { 'data-testid': 'leaflet-map' }, children),
    Marker: ({ eventHandlers, title }) =>
      React.createElement('button', {
        type: 'button',
        'data-testid': 'site-map-marker',
        'aria-label': title,
        onClick: eventHandlers.click,
      }),
    TileLayer: () => null,
    useMap: () => map,
  };
});

describe('DistrictAnalysisPage', () => {
  it('renders the study title and four district metrics', () => {
    render(<DistrictAnalysisPage />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Area of Study: Suan Luang District' }),
    ).toBeTruthy();
    expect(screen.getByText('123,291')).toBeTruthy();
    expect(screen.getByText('Population of Suan Luang')).toBeTruthy();
    expect(screen.getByText('6.09 m²')).toBeTruthy();
    expect(screen.getByText('20/50')).toBeTruthy();
    expect(screen.getByText('1.69 m²')).toBeTruthy();
    expect(screen.getAllByRole('article')).toHaveLength(4);
  });

  it('shows park details and the matching photo in the map information card', () => {
    render(<DistrictAnalysisPage />);

    const infoCard = screen.getByRole('complementary', { name: 'Selected park details' });
    expect(within(infoCard).getByRole('img', { name: /The garden for 15 minutes @the nine center/i })).toBeTruthy();
    expect(within(infoCard).getByText('13.740865, 100.623327')).toBeTruthy();
    expect(within(infoCard).getByText('Develop a green area new')).toBeTruthy();
    expect(within(infoCard).getByText('0.03 rai')).toBeTruthy();
    expect(within(infoCard).getByText('50.00 m²')).toBeTruthy();
    expect(within(infoCard).getByText('Private')).toBeTruthy();
  });

  it('keeps the complete 10-site table and includes both rai and square-metre areas', () => {
    render(<DistrictAnalysisPage />);

    expect(screen.getAllByTestId('site-map-marker')).toHaveLength(10);
    const table = screen.getByRole('table', { name: 'Selected green sites in Suan Luang' });
    expect(within(table).getAllByRole('row')).toHaveLength(11);
    expect(within(table).getByRole('columnheader', { name: 'Area (rai)' })).toBeTruthy();
    expect(within(table).getByRole('columnheader', { name: 'Area (m²)' })).toBeTruthy();
    expect(within(table).getByText('4.57 rai')).toBeTruthy();
    expect(within(table).getByText('7,308.00 m²')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Open the official 15-minute park map' }).getAttribute('href'))
      .toBe('https://greener.bangkok.go.th/en/map-15-minute-garden/');
  });

  it('updates the map information card when selecting an unpictured park', () => {
    render(<DistrictAnalysisPage />);

    fireEvent.click(screen.getByRole('button', { name: /Select Friendship Park phirom on map/i }));

    const infoCard = screen.getByRole('complementary', { name: 'Selected park details' });
    expect(within(infoCard).getByRole('heading', { name: 'Friendship Park phirom' })).toBeTruthy();
    expect(within(infoCard).queryByRole('img')).toBeNull();
    expect(within(infoCard).getByText('13.7051741, 100.6398471')).toBeTruthy();
    expect(within(infoCard).getByText('4.57 rai')).toBeTruthy();
    expect(within(infoCard).getByText('7,308.00 m²')).toBeTruthy();
    expect(within(infoCard).getByText('Bangkok')).toBeTruthy();
  });

  it('synchronizes table selection with the active park details', () => {
    render(<DistrictAnalysisPage />);

    const siteButton = screen.getByRole('button', { name: /Show Suan Luang saranrom on map/i });
    fireEvent.click(siteButton);

    expect(siteButton.getAttribute('aria-pressed')).toBe('true');
    const infoCard = screen.getByRole('complementary', { name: 'Selected park details' });
    expect(within(infoCard).getByRole('heading', { name: 'Suan Luang saranrom' })).toBeTruthy();
    expect(within(infoCard).getByRole('img', { name: 'Suan Luang saranrom' })).toBeTruthy();
    expect(within(infoCard).getByText('2.14 rai')).toBeTruthy();
  });
});
