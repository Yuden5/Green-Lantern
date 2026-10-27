// One-off: download Don Mueang district (OSM relation 1639287) and its neighbouring districts
// from the OpenStreetMap API (v0.6) into district-raw.json.
import fs from 'node:fs';

const DON_MUEANG = 1639287;
const HEADERS = { 'User-Agent': 'GreenSight-hackathon-mockdata/0.1 (one-off script)', Accept: 'application/json' };

async function get(path) {
  const res = await fetch(`https://api.openstreetmap.org/api/0.6/${path}`, { headers: HEADERS, signal: AbortSignal.timeout(60000) });
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  return res.json();
}

const elements = new Map();
const add = (json) => json.elements.forEach((el) => elements.set(`${el.type}/${el.id}`, el));

const dm = await get(`relation/${DON_MUEANG}/full.json`);
add(dm);
const dmRel = dm.elements.find((el) => el.type === 'relation' && el.id === DON_MUEANG);
console.log('Don Mueang:', dmRel.tags.name, dmRel.tags['name:en'], 'admin_level', dmRel.tags.admin_level);

// Neighbours = other district-level boundaries that share a boundary way with Don Mueang.
const neighbours = new Map();
for (const member of dmRel.members.filter((m) => m.type === 'way')) {
  const rels = await get(`way/${member.ref}/relations.json`);
  for (const rel of rels.elements) {
    const t = rel.tags ?? {};
    if (rel.id !== DON_MUEANG && t.boundary === 'administrative' && t.admin_level === dmRel.tags.admin_level) {
      neighbours.set(rel.id, `${t.name} / ${t['name:en'] ?? ''}`);
    }
  }
}
console.log('Neighbours:', [...neighbours].map(([id, n]) => `${id} ${n}`).join(' | '));

for (const id of neighbours.keys()) add(await get(`relation/${id}/full.json`));
fs.writeFileSync('district-raw.json', JSON.stringify({ version: '0.6', elements: [...elements.values()] }));
console.log(`saved ${elements.size} elements; neighbour ids: ${[...neighbours.keys()].join(',')}`);
