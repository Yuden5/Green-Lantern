# GreenSight data API

This is the contract between the frontend and the backend. The app focuses on **Don Mueang district** and the GISTDA frame **gisda_03**. The frontend needs **three endpoints**:

| Method | Path | Returns |
|---|---|---|
| GET | `{VITE_API_URL}/frames/gisda_03/grid` | NDVI values of the frame's grid (JSON) |
| GET | `{VITE_API_URL}/green-zones` | Green zones inside the frame (GeoJSON `FeatureCollection`) |
| GET | `{VITE_API_URL}/grey-zones` | Grey zones, the candidate sites, inside the frame (GeoJSON `FeatureCollection`) |

- Set `VITE_API_URL` in `.env` (copy `.env.example`), for example `VITE_API_URL=http://localhost:8000/api`. Restart `npm run dev` after changing it.
- When `VITE_API_URL` is empty, the app reads `src/mock/grids/gisda_03.json`, `src/mock/green-zones.geojson` and `src/mock/grey-zones.geojson` (built into the app) instead. **Those files are working examples of everything below.**
- Allow CORS from the frontend origin (`http://localhost:5173` during development).
- Reply with HTTP `200` and JSON. Any other status makes the app show "Couldn't load zone data" with a Retry button.

## Frames (frontend config, not an endpoint)

The GISTDA frames and their corner coordinates (`[lat, lng]`) live in `src/data/frames.js`:

| Frame | Status | Place |
|---|---|---|
| gisda_03 | `ready`, the focus frame | Don Mueang |
| gisda_01 | `soon`, shown as "Update soon" | Pak Kret / Lak Si |
| gisda_02 | `soon`, shown as "Update soon" | Chon Buri (Sattahip) |

## NDVI grid

```json
{
  "frameId": "gisda_03",
  "rows": 2,
  "cols": 3,
  "cellSizeM": 100,
  "ndvi": [
    [0.41, 0.18, -0.05],
    [0.33, 0.27, 0.62]
  ]
}
```

(The real gisda_03 grid is **600 × 600 cells of about 5 m** (`"cellSizeM": 5`). That's 360,000 NDVI values, about 1.7 MB of JSON, so turn on gzip on the server. See `src/mock/grids/gisda_03.json`.)

- `ndvi[row][col]`, where **row 0 is the north (top) edge** of the frame and **col 0 is the west (left) edge**.
- **The frontend works out every cell's corners itself** by splitting the frame evenly between its 4 corner coordinates (bilinear interpolation). Your grid must use the same layout: `rows` × `cols` equal steps from the top-left corner.
- **The frontend decides each cell's class:** NDVI **< 0 is water** (not counted), **< 0.3 is grey**, and **≥ 0.3 is green**. A value that isn't a number shows as an unknown cell.
- The frontend also works out the areas (km²) of the frame, the cells, and the green/grey totals. Don't send them.
- The frontend draws the grid as an image, one pixel per cell, so large grids stay fast.
- `rows` and `cols` must be whole numbers, and `ndvi` must have exactly `rows` lists. Otherwise the app shows the error card.

## Zones

Build the zones from the **same cells and the same NDVI rule**:

- **Green zone** = connected green cells.
- **Grey zone** = connected grey cells that are **open land** (not homes, roads, the airport or water). These are the candidate sites, ranked by fitness.

### Green zone feature

```json
{
  "type": "Feature",
  "properties": {
    "id": "GZ-001",
    "frameId": "gisda_03",
    "name": "Open green land 1",
    "nameTh": "ที่โล่งสีเขียว 1",
    "type": "Open green land",
    "district": "Don Mueang",
    "areaM2": 1076451,
    "populationNearby": 53300,
    "nearbyRadiusKm": 1,
    "ndvi": 0.37,
    "tempInsideC": 36,
    "tempAroundC": 37,
    "updatedAt": "2026-10-15"
  },
  "geometry": {
    "type": "Polygon",
    "coordinates": [[[100.579746, 13.920092], [100.582513, 13.920075], [100.582521, 13.920976], [100.579754, 13.920993], [100.579746, 13.920092]]]
  }
}
```

(The geometry is shortened here. See `src/mock/green-zones.geojson` for the real shapes.)

| Field | Type | Unit | Required | Meaning |
|---|---|---|---|---|
| `id` | string | | yes | Unique id |
| `frameId` | string | | no | Frame the zone belongs to |
| `name` | string | | yes | English name |
| `nameTh` | string | | no | Thai name |
| `type` | string | | no | For example "Grass field" (default "Green zone") |
| `district` | string | | yes | District |
| `areaM2` | number | m² | yes | Area of the zone (the app shows it in km²) |
| `populationNearby` | number | people | yes | People living within `nearbyRadiusKm` of the zone |
| `nearbyRadiusKm` | number | km | no | Default 1 |
| `ndvi` | number | −1 to 1 | no | Mean NDVI of the zone |
| `tempInsideC` | number | °C | no | Mean land surface temperature inside (Landsat 8/9) |
| `tempAroundC` | number | °C | no | Mean land surface temperature within `nearbyRadiusKm` |
| `updatedAt` | string | ISO date | no | When the numbers were computed |

### Grey zone feature

```json
{
  "type": "Feature",
  "properties": {
    "id": "G-001",
    "rank": 1,
    "frameId": "gisda_03",
    "district": "Don Mueang",
    "areaM2": 19971,
    "populationNearby": 13500,
    "nearbyRadiusKm": 1,
    "fitness": 0.78,
    "scores": { "greenAccessDeficit": 4, "airProximity": 4, "heatSeverity": 5 },
    "penalty": 0.05,
    "ndvi": 0.19,
    "surfaceTempC": 37.5,
    "nearestGreenZone": { "id": "GZ-004", "name": "Airfield grass 1", "distanceKm": 0.2 },
    "updatedAt": "2026-10-15"
  },
  "geometry": {
    "type": "Polygon",
    "coordinates": [[[100.593506, 13.910094], [100.59443, 13.910088], [100.594443, 13.91189], [100.59352, 13.911896], [100.593506, 13.910094]]]
  }
}
```

| Field | Type | Unit | Required | Meaning |
|---|---|---|---|---|
| `id` | string | | yes | Site id |
| `rank` | integer | | yes | 1 = highest priority, with no gaps (1…N) |
| `frameId` | string | | no | Frame the site belongs to |
| `district` | string | | yes | District |
| `areaM2` | number | m² | yes | Area of the site (the app shows it in km²) |
| `populationNearby` | number | people | yes | People living within `nearbyRadiusKm` of the site |
| `nearbyRadiusKm` | number | km | no | Default 1 |
| `fitness` | number | 0 to 1 | yes | Fitness score from the Hybrid GA |
| `scores.greenAccessDeficit` | integer | 1 to 5 | yes | Far from existing green space = high |
| `scores.airProximity` | integer | 1 to 5 | yes | Near major roads or industry = high |
| `scores.heatSeverity` | integer | 1 to 5 | yes | Hot surface compared with the study-area average = high |
| `penalty` | number | | no | "Surrounded" penalty already subtracted from fitness (default 0) |
| `ndvi` | number | −1 to 1 | no | Current NDVI of the site |
| `surfaceTempC` | number | °C | no | Land surface temperature |
| `nearestGreenZone` | object | | no | `{ "id", "name", "distanceKm" }`. Under 0.1 km shows as "next to it" |
| `updatedAt` | string | ISO date | no | When the numbers were computed |

Geometry: `Polygon` or `MultiPolygon`, WGS84 `[longitude, latitude]` (EPSG:4326).

## What the frontend computes (don't send these)

- **Cell corners**, from the frame's 4 corners and `rows` × `cols`.
- **Cell class:** water, grey or green from NDVI (0 and 0.3 thresholds).
- **Areas in km²** (spherical formula on the lat/lngs): the frame, each cell, green/grey/water totals, and the district.
- **m² per person** = `areaM2 / populationNearby`. It shows "—" if the population is missing or 0.
- **Status:** ≥ 9 m² meets the target, 3 to under 9 is below target, and under 3 is far below target.
- **Priority tier:** fitness ≥ 0.75 is high, ≥ 0.50 is medium, and the rest are low.
- **"rank N of M"**, where M is the number of grey zones you return.

## How the frontend treats your data

- A zone without `properties.id` or without polygon geometry is skipped, and a warning appears in the browser console.
- A number that is missing or not finite shows as "—". The cards still render.
- Extra fields are ignored, so it is safe to send more.
