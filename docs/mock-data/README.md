# How the mock data was made

These scripts made the files in `src/mock/` and `src/data/districts.json`. They are **not** part of the app. They need two extra packages, so run them in a separate folder:

```bash
mkdir greensight-mockgen && cd greensight-mockgen
npm init -y && npm install osmtogeojson@3.0.0-beta.5 @turf/turf@7
# copy the three .mjs files from docs/mock-data/ into this folder, then:
node fetch-district.mjs       # Don Mueang + neighbouring districts → district-raw.json
node fetch-frame-osm.mjs      # OpenStreetMap data around gisda_03 → frame-raw.json
node make-don-mueang-data.mjs <path to the project>
```

- **Real data:** district boundaries, land use, buildings, roads, runways and canals come from OpenStreetMap (© OpenStreetMap contributors, ODbL).
- **Simulated data:** NDVI, temperatures, population and fitness are **simulated** from that land cover. They are not THEOS-2 measurements.
- **Repeatable:** the random numbers are seeded, so the same downloads always give the same files.
