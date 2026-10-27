/** Backend base URL from .env. Empty means "use the example files in src/mock/". */
export const API_URL = (import.meta.env.VITE_API_URL ?? '').trim().replace(/\/+$/, '');
export const USING_MOCK_DATA = API_URL === '';

/**
 * Standard OpenStreetMap tiles: open data, no API key. Fine for development and demos; for heavy
 * traffic use a tile provider or self-host (https://operations.osmfoundation.org/policies/tiles/).
 * Its colors are muted in src/index.css (.basemap) so the zone colors stand out.
 */
export const BASEMAP = {
  url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom: 19,
};

/** The map opens on Don Mueang; minZoom is raised at runtime so you can't zoom far out of it. */
export const MAP_DEFAULTS = {
  zoom: 13,
  minZoom: 10,
  maxZoom: 19,
};
