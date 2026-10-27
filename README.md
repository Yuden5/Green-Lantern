# GreenSight frontend

An interactive map dashboard for **GreenSight: Optimization of Urban Green Space Development Sites using THEOS-2** (GeoHackathon 2026). It focuses on **Don Mueang district (เขตดอนเมือง)** and the GISTDA THEOS-2 frame **gisda_03**.

- **Classified grid:** the frame is split into a **600 × 600 grid of cells (about 5 m each)**. Every cell is decided **green** (NDVI ≥ 0.3), **grey** (NDVI < 0.3) or water from its NDVI value, and the grid is drawn as a fast image.
- **Clickable zones:** **green zones** (connected green cells) and **grey zones** (connected open-land grey cells, the candidate sites for new green space). Click either to see its stats.
- **Areas in km²**, calculated from the real latitude/longitude.
- **"Update soon":** everything outside Don Mueang is grey and labeled that way.

> This is the frontend only. It runs on **mock data** until the backend is connected (see below).

## Run it

You need Node.js 22.12 or newer (tested with Node 24).

**Windows: double-click `start.bat`.** It installs the packages the first time, starts the app on localhost, and opens your browser. Close its window to stop the app.

Or in a terminal:

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server with hot reload |
| `npm test` | Run the unit and component tests once |
| `npm run build` | Make a production build in `dist/` |
| `npm run preview` | Serve the production build locally |

## Put it online for everyone

1. Run `npm run build`. It makes the `dist/` folder: the whole app, with the example data built in.
2. Upload everything inside `dist/` to any static web host, for example GitHub Pages, Netlify, Vercel, or a folder on a school or office web server. It works at the top of a site and in a subfolder such as `https://example.com/greensight/`, with no extra settings.
3. Share the address. Anyone with the link can use the app in their browser.

Don't open `dist/index.html` by double-clicking it, because browsers block apps opened as files. To try the build on your own computer, run `npm run preview`.

## If it says "Couldn't load zone data"

The card shows the address that failed and why, for example `Loading …/green-zones.geojson failed with HTTP 404`.

- **With the "Mock data" badge:** the example data didn't load. Make sure your copy has the `src/mock/` folder (it holds the example data) and the current `vite.config.js`, then build again.
- **Without the badge:** the app is using the backend in `VITE_API_URL`. Check that the backend is running, that the address is right, and that it allows CORS from the app's address.

## Connect the backend

1. Copy `.env.example` to `.env`.
2. Set `VITE_API_URL` to the backend base URL, for example `VITE_API_URL=http://localhost:8000/api`.
3. Restart `npm run dev`. The "Mock data" badge disappears.

The backend has to serve the NDVI grid of gisda_03 plus the green and grey zones. **[docs/API.md](docs/API.md)** describes them, and the files in `src/mock/` are working examples.

## How to use the app

- **Moving around:** the map opens on Don Mueang and stays there. Zoom with the + / − buttons, the mouse wheel or a pinch. ⤢ fits the district again.
- **Click a green or orange zone** inside the gisda_03 frame to see its stats. To go back to the overview, press Esc, click ×, or click empty map.
- **Layers** (top right of the map): the green/grey grid, green zones and grey zones.

## Project structure

```
src/
  App.jsx               page layout, selected zone, layer switches, Esc key
  config.js             backend URL, basemap, map zoom limits
  data/frames.js        the GISTDA frames (corner lat/lng) and which one is ready
  data/districts.json   Don Mueang + neighbouring district boundaries (OpenStreetMap)
  api/data.js           loads and checks the NDVI grid and the zones (mock files or backend)
  hooks/useMapData.js   loading / error / retry state
  lib/geo.js            areas in km², frame corners → cell corners, the grey cover
  lib/grid.js           NDVI → green / grey / water cells, area per class
  lib/                  metrics (m² per person, status, tiers), formatting
  components/map/       Leaflet map, layer switches, legend
  components/sidebar/   overview, green zone and grey zone panels
  components/charts/    half pie gauge, cooling chart, factor bars, priority bar
  components/ui/        cards, badges, lists, loading and error states
  mock/                 example data, built into the app (also examples of the API format)
public/                 favicon
docs/API.md             the data contract for the backend
```

## Mock data

- **Real data:** the district boundaries and land cover come from OpenStreetMap (© OpenStreetMap contributors, ODbL).
- **Simulated data:** the **NDVI values, temperatures, population and fitness scores** are simulated from that land cover. Grass, trees and fields give a high NDVI, while homes, buildings, roads, runways and aprons (drawn at their real width) give a low one. They are **not** THEOS-2 measurements, and the backend will replace them.
- **Mock result for gisda_03:** green 1.913 km², grey 6.894 km², water 0.171 km², with 44 green zones (≥ 0.5 ha) and the 20 best of 151 candidate sites.
- **Where it lives:** `src/mock/`. Because it sits with the code, it is built into the app and loads wherever the app is hosted.
- **How it was made:** the scripts that made the mock data are in [docs/mock-data/](docs/mock-data/README.md).

## Changing things

- **Rules:** the NDVI rule (0.3 for green, 0 for water), the 9 m² target and the priority tiers are in `src/lib/constants.js`.
- **Frames:** `src/data/frames.js`. Mark a frame `ready` once the backend serves its grid. The app currently loads the grid of `FOCUS_FRAME`.
- **Colors:** UI colors are in `src/index.css` (`@theme`), and data colors are in `src/lib/constants.js`.
- **Basemap:** the tile URL and attribution are in `src/config.js`.

## Credits

Map data and basemap tiles © OpenStreetMap contributors. The tiles come from `tile.openstreetmap.org` and need no API key, which is fine for development and demos. For heavy traffic, use a tile provider or host your own tiles (see the [tile usage policy](https://operations.osmfoundation.org/policies/tiles/)). The satellite data sources (THEOS-2 from GISTDA, Landsat 8/9 from USGS) are described in the project report.
