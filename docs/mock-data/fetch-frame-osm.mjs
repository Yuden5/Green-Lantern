// One-off: download all OpenStreetMap data inside the gisda_03 frame (plus a 1 km margin, for
// "people nearby" / nearest-park context) from the OSM API (v0.6) into frame-raw.json.
// The API caps one /map call at 50,000 nodes, so the box is fetched as a 3×3 grid of tiles.
import fs from 'node:fs';

const BOX = { west: 100.5700, south: 13.8990, east: 100.6170, north: 13.9450 };
const N = 3;
const HEADERS = { 'User-Agent': 'GreenSight-hackathon-mockdata/0.1 (one-off script)', Accept: 'application/json' };

const elements = new Map();
for (let i = 0; i < N; i++) {
  for (let j = 0; j < N; j++) {
    const w = BOX.west + ((BOX.east - BOX.west) * i) / N;
    const e = BOX.west + ((BOX.east - BOX.west) * (i + 1)) / N;
    const s = BOX.south + ((BOX.north - BOX.south) * j) / N;
    const n = BOX.south + ((BOX.north - BOX.south) * (j + 1)) / N;
    const bbox = [w, s, e, n].map((v) => v.toFixed(5)).join(',');
    const res = await fetch(`https://api.openstreetmap.org/api/0.6/map.json?bbox=${bbox}`, {
      headers: HEADERS,
      signal: AbortSignal.timeout(120000),
    });
    if (!res.ok) throw new Error(`tile ${i},${j} (${bbox}): HTTP ${res.status} ${await res.text()}`);
    const json = await res.json();
    for (const el of json.elements) elements.set(`${el.type}/${el.id}`, el);
    console.log(`tile ${i},${j}: ${json.elements.length} elements (total unique ${elements.size})`);
  }
}
fs.writeFileSync('frame-raw.json', JSON.stringify({ version: '0.6', elements: [...elements.values()] }));
console.log('saved frame-raw.json');
