import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import PolicyPage from './PolicyPage.jsx';

describe('PolicyPage', () => {
  it('renders page title and all three core sections', () => {
    render(<PolicyPage />);

    expect(screen.getByRole('heading', { level: 1, name: /Green Bangkok 2030/i })).toBeTruthy();
    expect(screen.getByText(/Launched in December 2019 by the Bangkok Metropolitan Administration/i)).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2, name: /The 3 Targets/i })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2, name: /Reported delivery/i })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2, name: /From policy to implementation/i })).toBeTruthy();
    expect(screen.queryByRole('heading', { level: 2, name: /What the total cannot tell us/i })).toBeNull();
  });

  it('renders the park illustration and the three target gallery slides', () => {
    const { container } = render(<PolicyPage />);

    expect(screen.getByRole('img', { name: 'A geometric neighborhood park' })).toBeTruthy();
    expect(screen.queryByAltText(/Green Bangkok 2030 logo/i)).toBeNull();
    expect(screen.queryByText('Citywide ambition · 2030')).toBeNull();
    expect(container.querySelectorAll('.park-falling-leaf')).toHaveLength(5);

    expect(screen.getAllByText('10').length).toBeGreaterThan(0);
    expect(screen.getByText('m²')).toBeTruthy();
    expect(screen.getAllByText('Green space per person').length).toBeGreaterThan(0);

    expect(screen.getByText('50%')).toBeTruthy();
    expect(screen.getByText('City within 400 m of green space')).toBeTruthy();

    expect(screen.getByText('30%')).toBeTruthy();
    expect(screen.getByText('Urban tree canopy target')).toBeTruthy();
    expect(screen.queryByText('Green Bangkok 2030 target')).toBeNull();
    expect(screen.getByRole('region', { name: 'Green Bangkok 2030 targets' })).toBeTruthy();
    const targetImageSources = [...container.querySelectorAll('.target-gallery-slide img')]
      .map((image) => image.getAttribute('src'));
    expect(targetImageSources.some((source) => source.includes('target1'))).toBe(true);
    expect(targetImageSources.some((source) => source.includes('target2'))).toBe(true);
    expect(targetImageSources.some((source) => source.includes('target3'))).toBe(true);
    expect(container.querySelectorAll('.target-gallery-slide')).toHaveLength(3);
  });

  it('moves through target slides with the gallery controls and arrow keys', () => {
    render(<PolicyPage />);

    const gallery = screen.getByRole('region', { name: 'Green Bangkok 2030 targets' });
    const slides = screen.getAllByRole('button', { name: /Green space per person|City within 400 m|Urban tree canopy target/ });

    expect(slides[0].getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Next target' }));
    expect(slides[1].getAttribute('aria-pressed')).toBe('true');
    fireEvent.keyDown(gallery, { key: 'ArrowRight' });
    expect(slides[2].getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Previous target' }));
    expect(slides[1].getAttribute('aria-pressed')).toBe('true');
  });

  it('changes the selected target when the gallery is dragged', () => {
    const { container } = render(<PolicyPage />);
    const galleryViewport = container.querySelector('.target-gallery-viewport');
    const slides = screen.getAllByRole('button', { name: /Green space per person|City within 400 m|Urban tree canopy target/ });

    fireEvent.pointerDown(galleryViewport, { clientX: 280, pointerId: 1 });
    fireEvent.pointerUp(galleryViewport, { clientX: 160, pointerId: 1 });

    expect(slides[1].getAttribute('aria-pressed')).toBe('true');
  });

  it('opens the selected target image full size and closes it accessibly', () => {
    render(<PolicyPage />);

    fireEvent.click(screen.getByRole('button', { name: /Open full image: 50%/ }));
    expect(screen.getByRole('dialog', { name: /Full image: 50%/ })).toBeTruthy();
    expect(screen.getByRole('img', { name: /50%: City within 400 m of green space/ })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Close full-size image' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders the five implementation timeline milestones and images', () => {
    const { container } = render(<PolicyPage />);

    expect(screen.getByText('2019')).toBeTruthy();
    expect(screen.getByRole('heading', { level: 3, name: 'The Vision' })).toBeTruthy();
    expect(screen.getByText('2021–2022')).toBeTruthy();
    expect(screen.getByRole('heading', { level: 3, name: 'The Action' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 3, name: '15-Minute Parks' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 3, name: 'GeoHackathon' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 3, name: 'The Target' })).toBeTruthy();
    expect(container.querySelectorAll('.policy-milestone')).toHaveLength(5);
    const milestoneImageSources = [...container.querySelectorAll('.policy-milestone-image')]
      .map((image) => image.getAttribute('src'));
    expect(milestoneImageSources.map((source) => (
      ['p1', 'p2', 'p3', 'p4', 'p5'].findIndex((image) => source.includes(image))
    ))).toEqual([0, 1, 2, 3, 4]);

    expect(screen.getByRole('heading', { level: 2, name: 'Reported delivery' })).toBeTruthy();
    expect(screen.getAllByText('569').length).toBeGreaterThan(0);
    expect(screen.getAllByText('357 parks').length).toBeGreaterThan(0);
    expect(screen.getByText(/The FY2025 report cites 569 15-minute parks against a planned target of 357/i)).toBeTruthy();
  });

  it('switches the park chart from counts to calculated share of target', () => {
    render(<PolicyPage />);

    const shareButton = screen.getByRole('button', { name: 'Share of target' });
    fireEvent.click(shareButton);

    expect(shareButton.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText('About 159% of the planned target, calculated from 569 reported parks ÷ 357 planned parks.')).toBeTruthy();
    expect(screen.getByRole('img', { name: /Reported FY2025: 159%.*Planned target: 100%/i })).toBeTruthy();
  });

  it('renders actual Bangkok district boundaries and selects profile data from search', () => {
    const { container } = render(<PolicyPage />);

    expect(container.querySelectorAll('.policy-district-slice')).toHaveLength(50);
    expect(container.querySelector('.policy-district-list')).toBeNull();
    expect(screen.getByRole('group', { name: /Interactive Bangkok district map/i })).toBeTruthy();
    expect(screen.getByText('Select a district to explore its green-space profile.')).toBeTruthy();
    expect(container.querySelector('.policy-district-selected-name')).toBeNull();
    expect(container.querySelector('.policy-district-slice.is-selected')).toBeNull();

    const districtSearch = screen.getByLabelText('Search a district');
    fireEvent.change(districtSearch, { target: { value: 'Bangkok Noi' } });

    expect(screen.getByRole('button', { name: /Bangkok Noi: 10 gardens/ }).getAttribute('aria-pressed')).toBe('true');
    expect(container.querySelector('.policy-district-selected-name').textContent).toBe('Bangkok Noi');
    expect(screen.getByText('51,091')).toBeTruthy();
    expect(screen.getByText('5.32 m²')).toBeTruthy();
  });

  it('filters district colouring by an available per-capita metric', () => {
    const { container } = render(<PolicyPage />);
    fireEvent.change(screen.getByLabelText('Search a district'), { target: { value: 'Suan Luang' } });
    const metricFilter = screen.getByLabelText('Colour districts by');
    fireEvent.change(metricFilter, { target: { value: 'accessibleGreenSpacePerPersonM2' } });

    expect(screen.getByRole('group', { name: /coloured by accessible green space per person/i })).toBeTruthy();
    expect(container.querySelector('.policy-map-legend-label').textContent).toMatch(/Accessible green space per person/);
    expect(screen.getByText('1.69 m²')).toBeTruthy();
    expect(container.querySelector('.policy-photo-mosaic')).toBeNull();
  });

  it('flags source discrepancies without rewriting either figure', () => {
    render(<PolicyPage />);

    expect(screen.getByText(/Policy target is 10 m² per person; the Dashboard uses a 9 m² per-person constant/i)).toBeTruthy();
    expect(screen.getByText(/official 15-Minute Garden map cites 530 gardens/i)).toBeTruthy();
    expect(screen.getByText(/569 15-minute parks against a planned target of 357/i)).toBeTruthy();
  });
});
