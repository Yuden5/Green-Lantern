import { API_URL } from '../config.js';
import { DEFAULT_RADIUS_KM } from '../lib/constants.js';

// The example data in src/mock/, used while VITE_API_URL is empty. Vite bundles these files and hands
// out their URLs, so they load wherever the app is hosted (site root or any folder) and they travel
// with the source code.
const MOCK_FILES = import.meta.glob('../mock/**/*.{json,geojson}', { query: '?url', import: 'default', eager: true });

/** Where a zone layer lives: the backend when VITE_API_URL is set, otherwise the example file. */
export function zonesUrl(layer, baseUrl = API_URL) {
  return baseUrl ? `${baseUrl}/${layer}-zones` : MOCK_FILES[`../mock/${layer}-zones.geojson`];
}

/** Where a frame's NDVI grid lives. */
export function gridUrl(frameId, baseUrl = API_URL) {
  if (baseUrl) return `${baseUrl}/frames/${frameId}/grid`;
  const url = MOCK_FILES[`../mock/grids/${frameId}.json`];
  if (!url) throw new Error(`There is no example grid for frame ${frameId} (src/mock/grids/${frameId}.json).`);
  return url;
}

const num = (value) => (typeof value === 'number' && Number.isFinite(value) ? value : null);
const str = (value) => (typeof value === 'string' && value.trim() !== '' ? value : null);
const isPolygonal = (geometry) =>
  (geometry?.type === 'Polygon' || geometry?.type === 'MultiPolygon') && Array.isArray(geometry.coordinates);

function normalizeGreen(p) {
  return {
    id: String(p.id),
    name: str(p.name) ?? String(p.id),
    nameTh: str(p.nameTh),
    type: str(p.type) ?? 'Green zone',
    district: str(p.district),
    areaM2: num(p.areaM2),
    populationNearby: num(p.populationNearby),
    nearbyRadiusKm: num(p.nearbyRadiusKm) ?? DEFAULT_RADIUS_KM,
    ndvi: num(p.ndvi),
    tempInsideC: num(p.tempInsideC),
    tempAroundC: num(p.tempAroundC),
    updatedAt: str(p.updatedAt),
  };
}

function normalizeGrey(p) {
  const scores = p.scores ?? {};
  const nearest = p.nearestGreenZone;
  return {
    id: String(p.id),
    district: str(p.district),
    areaM2: num(p.areaM2),
    populationNearby: num(p.populationNearby),
    nearbyRadiusKm: num(p.nearbyRadiusKm) ?? DEFAULT_RADIUS_KM,
    fitness: num(p.fitness),
    rank: num(p.rank),
    scores: {
      greenAccessDeficit: num(scores.greenAccessDeficit),
      airProximity: num(scores.airProximity),
      heatSeverity: num(scores.heatSeverity),
    },
    penalty: num(p.penalty) ?? 0,
    ndvi: num(p.ndvi),
    surfaceTempC: num(p.surfaceTempC),
    nearestGreenZone:
      nearest && typeof nearest === 'object'
        ? { id: str(nearest.id), name: str(nearest.name), distanceKm: num(nearest.distanceKm) }
        : null,
    updatedAt: str(p.updatedAt),
  };
}

const NORMALIZERS = { green: normalizeGreen, grey: normalizeGrey };

/** Checks a FeatureCollection and normalizes every feature's properties (see docs/API.md). */
export function normalizeCollection(json, layer) {
  if (json?.type !== 'FeatureCollection' || !Array.isArray(json.features)) {
    throw new Error(`The ${layer} zone data is not a GeoJSON FeatureCollection.`);
  }
  const normalize = NORMALIZERS[layer];
  const features = [];
  for (const feature of json.features) {
    const id = feature?.properties?.id;
    if (id === undefined || id === null || id === '' || !isPolygonal(feature.geometry)) {
      console.warn(`Skipping a ${layer} zone without an id or polygon geometry`, feature);
      continue;
    }
    features.push({ type: 'Feature', geometry: feature.geometry, properties: normalize(feature.properties) });
  }
  return { type: 'FeatureCollection', features };
}

/** Checks an NDVI grid ({ rows, cols, ndvi[row][col] }, see docs/API.md); bad values become null. */
export function normalizeGrid(json, frameId) {
  const { rows, cols, ndvi } = json ?? {};
  if (!Number.isInteger(rows) || !Number.isInteger(cols) || rows < 1 || cols < 1 || !Array.isArray(ndvi) || ndvi.length !== rows) {
    throw new Error(`The NDVI grid of ${frameId} needs "rows", "cols" and one "ndvi" list per row.`);
  }
  return {
    frameId,
    rows,
    cols,
    cellSizeM: num(json.cellSizeM),
    ndvi: ndvi.map((row) => Array.from({ length: cols }, (_, col) => num(Array.isArray(row) ? row[col] : undefined))),
  };
}

// Every error names the address, so the message on the error card says exactly what failed.
async function getJson(url, signal) {
  let response;
  try {
    response = await fetch(url, { signal, headers: { Accept: 'application/geo+json, application/json' } });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new Error(`Couldn't reach ${url}: ${error.message}`, { cause: error });
  }
  if (!response.ok) throw new Error(`Loading ${url} failed with HTTP ${response.status}.`);
  try {
    return await response.json();
  } catch (error) {
    throw new Error(`${url} is not JSON (${error.message}).`, { cause: error });
  }
}

/** Loads one zone layer ('green' or 'grey'). Throws on network errors, non-2xx responses and bad data. */
export async function fetchZones(layer, { baseUrl = API_URL, signal } = {}) {
  return normalizeCollection(await getJson(zonesUrl(layer, baseUrl), signal), layer);
}

/** Loads the NDVI grid of a frame. Throws on network errors, non-2xx responses and bad data. */
export async function fetchGrid(frameId, { baseUrl = API_URL, signal } = {}) {
  return normalizeGrid(await getJson(gridUrl(frameId, baseUrl), signal), frameId);
}
