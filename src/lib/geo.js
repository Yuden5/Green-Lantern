// Geometry on [lng, lat] coordinates (GeoJSON order).
// Areas use the same spherical formula and mean Earth radius as turf.js, so they match its numbers.
const EARTH_RADIUS_M = 6371008.8;
const toRad = (deg) => (deg * Math.PI) / 180;

/** Area in m² enclosed by a closed ring of [lng, lat] points. */
export function ringAreaM2(ring) {
  let total = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [lng1, lat1] = ring[i];
    const [lng2, lat2] = ring[i + 1];
    total += toRad(lng2 - lng1) * (2 + Math.sin(toRad(lat1)) + Math.sin(toRad(lat2)));
  }
  return Math.abs((total * EARTH_RADIUS_M * EARTH_RADIUS_M) / 2);
}

/** Area in m² of a GeoJSON Polygon or MultiPolygon, holes subtracted. 0 for anything else. */
export function polygonAreaM2(geometry) {
  let polygons = [];
  if (geometry?.type === 'Polygon') polygons = [geometry.coordinates];
  if (geometry?.type === 'MultiPolygon') polygons = geometry.coordinates;
  return polygons.reduce(
    (sum, [outer, ...holes]) => sum + ringAreaM2(outer) - holes.reduce((holeSum, hole) => holeSum + ringAreaM2(hole), 0),
    0,
  );
}

/**
 * A point inside a four-corner frame, as [lng, lat]. u runs 0 → 1 from the left (west) edge to the
 * right (east) edge, v runs 0 → 1 from the top (north) edge to the bottom (south) edge.
 * corners = { topLeft, topRight, bottomLeft, bottomRight }, each [lat, lng].
 */
export function pointInFrame(corners, u, v) {
  const { topLeft: tl, topRight: tr, bottomLeft: bl, bottomRight: br } = corners;
  const lat = (1 - v) * ((1 - u) * tl[0] + u * tr[0]) + v * ((1 - u) * bl[0] + u * br[0]);
  const lng = (1 - v) * ((1 - u) * tl[1] + u * tr[1]) + v * ((1 - u) * bl[1] + u * br[1]);
  return [lng, lat];
}

/**
 * Closed GeoJSON ring (top-left → bottom-left → bottom-right → top-right) for the part of a frame
 * between (u0, v0) and (u1, v1). Without a range it is the whole frame.
 */
export function frameRing(corners, [u0, v0, u1, v1] = [0, 0, 1, 1]) {
  const ring = [
    pointInFrame(corners, u0, v0),
    pointInFrame(corners, u0, v1),
    pointInFrame(corners, u1, v1),
    pointInFrame(corners, u1, v0),
  ];
  return [...ring, ring[0]];
}

/** Center of a frame as [lat, lng]. */
export function frameCenter(corners) {
  const [lng, lat] = pointInFrame(corners, 0.5, 0.5);
  return [lat, lng];
}

/** A box [west, south, east, north] with the focus area cut out of it, for the grey "update soon" cover. */
export function maskPolygon(focusGeometry, [west, south, east, north]) {
  const box = [[west, south], [east, south], [east, north], [west, north], [west, south]];
  const polygons = focusGeometry.type === 'Polygon' ? [focusGeometry.coordinates] : focusGeometry.coordinates;
  return { type: 'Polygon', coordinates: [box, ...polygons.map((polygon) => polygon[0])] };
}
