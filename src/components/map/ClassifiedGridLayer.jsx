import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { COLORS } from '../../lib/constants.js';
import { CLASS } from '../../lib/grid.js';
import { affineFromPoints, hexToRgb, paintClasses } from '../../lib/raster.js';

const ALPHA = 120; // ≈47% opacity
const PALETTE = [];
PALETTE[CLASS.unknown] = [0, 0, 0, 0];
PALETTE[CLASS.water] = [0, 0, 0, 0]; // not drawn: the basemap already shows the water
PALETTE[CLASS.grey] = [...hexToRgb(COLORS.gridGrey), ALPHA];
PALETTE[CLASS.green] = [...hexToRgb(COLORS.gridGreen), ALPHA];

/** The class image (one pixel per cell) plus halved copies, used when the map is zoomed out. */
function buildMipmaps(classified) {
  const base = document.createElement('canvas');
  base.width = classified.cols;
  base.height = classified.rows;
  const pixels = paintClasses(classified, PALETTE);
  base.getContext('2d').putImageData(new ImageData(pixels, classified.cols, classified.rows), 0, 0);
  const levels = [base];
  while (levels.at(-1).width > 32 && levels.at(-1).height > 32) {
    const previous = levels.at(-1);
    const next = document.createElement('canvas');
    next.width = Math.ceil(previous.width / 2);
    next.height = Math.ceil(previous.height / 2);
    next.getContext('2d').drawImage(previous, 0, 0, next.width, next.height);
    levels.push(next);
  }
  return levels;
}

/** Draws `image` mapped from the source triangle onto the tile triangle, grown by 1 px so neighbours meet without a seam. */
function drawTriangle(ctx, image, source, target) {
  const cx = (target[0][0] + target[1][0] + target[2][0]) / 3;
  const cy = (target[0][1] + target[1][1] + target[2][1]) / 3;
  ctx.save();
  ctx.beginPath();
  target.forEach(([x, y], i) => {
    const length = Math.hypot(x - cx, y - cy) || 1;
    const px = x + (x - cx) / length;
    const py = y + (y - cy) / length;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.closePath();
  ctx.clip();
  ctx.setTransform(...affineFromPoints(source, target));
  ctx.drawImage(image, 0, 0);
  ctx.restore();
}

/** A Leaflet GridLayer whose tiles show the classified frame (two affine triangles per tile). */
function createGridLayer(frame, classified, pane) {
  const mipmaps = buildMipmaps(classified);
  const { topLeft, topRight, bottomRight, bottomLeft } = frame.corners;
  const corners = [topLeft, topRight, bottomRight, bottomLeft].map(([lat, lng]) => L.latLng(lat, lng));

  const FrameGrid = L.GridLayer.extend({
    createTile(coords) {
      const size = this.getTileSize();
      const tile = document.createElement('canvas');
      tile.width = size.x;
      tile.height = size.y;
      const origin = coords.scaleBy(size);
      const [tl, tr, br, bl] = corners.map((latLng) => {
        const point = this._map.project(latLng, coords.z).subtract(origin);
        return [point.x, point.y];
      });
      // Use the copy whose pixels are closest to the on-screen cell size: smooth when zoomed out,
      // crisp squares (one per cell) when zoomed in.
      const pixelsPerCell = Math.hypot(tr[0] - tl[0], tr[1] - tl[1]) / classified.cols;
      const level = Math.max(0, Math.min(mipmaps.length - 1, Math.round(Math.log2(1 / pixelsPerCell))));
      const image = mipmaps[level];
      const ctx = tile.getContext('2d');
      ctx.imageSmoothingEnabled = level > 0 || pixelsPerCell < 1;
      const [w, h] = [image.width, image.height];
      // Two triangles, each with its own affine map, so all four frame corners land exactly.
      drawTriangle(ctx, image, [[0, 0], [w, 0], [0, h]], [tl, tr, bl]);
      drawTriangle(ctx, image, [[w, 0], [w, h], [0, h]], [tr, br, bl]);
      return tile;
    },
  });

  return new FrameGrid({ pane, bounds: L.latLngBounds(corners), updateWhenZooming: false });
}

/** The classified grid of a frame (green / grey cells), drawn from a one-pixel-per-cell image. */
export default function ClassifiedGridLayer({ frame, classified, pane }) {
  const map = useMap();
  useEffect(() => {
    const layer = createGridLayer(frame, classified, pane);
    layer.addTo(map);
    return () => {
      layer.remove();
    };
  }, [map, frame, classified, pane]);
  return null;
}
