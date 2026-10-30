import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import HomePage from './HomePage.jsx';

vi.mock('../components/FloatingIsland.jsx', () => ({
  default: () => <div role="img" aria-label="Floating low-poly island reused in Our Mission" />,
}));

describe('HomePage', () => {
  it('shows the floating island hero, dashboard destination, stories, and partners', () => {
    render(<HomePage />);

    expect(screen.getByRole('heading', { level: 1, name: /Green Lantern/i })).toBeTruthy();
    expect(screen.getByRole('img', { name: /floating low-poly island reused in our mission/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /Explore the Green Dashboard/i }).getAttribute('href')).toBe(
      'https://sorrymybadmmiv.github.io/Green-zone-UI-V3/',
    );
    expect(screen.queryByRole('link', { name: /Start with Suan Luang/i })).toBeNull();
    expect(screen.queryByRole('link', { name: /Discover the atlas/i })).toBeNull();
    expect(screen.getByRole('img', { name: /Two leafy trees shade a park bench/i })).toBeTruthy();
    expect(screen.getByRole('img', { name: /A dry plot of land/i })).toBeTruthy();
    expect(screen.getByRole('img', { name: /A person walking among trees/i })).toBeTruthy();
    expect(screen.getByRole('img', { name: /Partner logos/i })).toBeTruthy();
  });

  it('omits section markers and prepares story content for scroll reveals', () => {
    render(<HomePage />);

    expect(screen.queryByRole('navigation', { name: /Story sections/i })).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
    expect(document.querySelectorAll('.home-story-slide .home-reveal')).toHaveLength(6);
    expect(screen.getByText(/Not every neighborhood has the same access/i)).toBeTruthy();
  });

  it('provides Policy and District Analysis links in Our Mission', () => {
    render(<HomePage />);

    expect(screen.getByRole('link', { name: /Policy/i }).getAttribute('href')).toBe('#/policy');
    expect(screen.getByRole('link', { name: /District Analysis/i }).getAttribute('href')).toBe('#/district-analysis');
    expect(document.querySelector('.home-mission-island')).toBeNull();
    expect(screen.getByRole('link', { name: /About GeoHackathon 2026/i }).getAttribute('href')).toBe(
      'https://geohackathon.gistda.or.th/',
    );
  });
});
