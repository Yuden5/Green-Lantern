import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { GeoJSON, MapContainer, Marker, Pane, TileLayer, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { LoaderCircle, Maximize, Minus, Plus } from 'lucide-react';
import { BASEMAP, MAP_DEFAULTS } from '../../config.js';
import districts from '../../data/districts.json';
import { FOCUS_FRAME, FRAMES } from '../../data/frames.js';
import { COLORS } from '../../lib/constants.js';
import { formatKm2 } from '../../lib/format.js';
import { frameCenter, frameRing, maskPolygon, polygonAreaM2 } from '../../lib/geo.js';
import { priorityTier } from '../../lib/metrics.js';
import ClassifiedGridLayer from './ClassifiedGridLayer.jsx';
import LayerControl from './LayerControl.jsx';
import MapLegend from './MapLegend.jsx';

// ---- Static focus data (Don Mueang, its neighbours and the GISTDA frames) ----
const FOCUS = districts.features.find((f) => f.properties.role === 'focus');
const NEIGHBOURS = districts.features.filter((f) => f.properties.role === 'soon');
const [WEST, SOUTH, EAST, NORTH] = districts.metadata.viewBounds;
const VIEW_BOUNDS = L.latLngBounds([SOUTH, WEST], [NORTH, EAST]);
const FOCUS_BOUNDS = L.geoJSON(FOCUS).getBounds();
const FIT_OPTIONS = { padding: [24, 24] };
// The grey "update soon" cover reaches far past the view, so panning never shows its edge.
const MASK = maskPolygon(FOCUS.geometry, [WEST - 1, SOUTH - 1, EAST + 1, NORTH + 1]);
const FRAME_SHAPES = FRAMES.map((frame) => {
  const geometry = { type: 'Polygon', coordinates: [frameRing(frame.corners)] };
  return { frame, geometry, areaM2: polygonAreaM2(geometry) };
});

const escapeHtml = (text) =>
  String(text).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);
const labelIcon = (html, className = '') =>
  L.divIcon({ className: `map-label ${className}`.trim(), html: `<span>${html}</span>`, iconSize: null });
const SOON = '<small>Update soon</small>';
const LABELS = [
  ...NEIGHBOURS.map(({ properties: p }) => ({
    id: p.id,
    position: [p.label[1], p.label[0]],
    icon: labelIcon(`${escapeHtml(p.nameEn)} · ${escapeHtml(p.nameTh)}${SOON}`),
  })),
  ...FRAME_SHAPES.map(({ frame, areaM2 }) =>
    frame.status === 'ready'
      ? { id: frame.id, position: frame.corners.topLeft, icon: labelIcon(`${escapeHtml(frame.id)} · ${formatKm2(areaM2)}`, 'frame-label') }
      : { id: frame.id, position: frameCenter(frame.corners), icon: labelIcon(`${escapeHtml(frame.id)}${SOON}`) },
  ),
];

/** Grey cover outside Don Mueang, neighbour outlines, the Don Mueang outline, frames and labels. */
const FocusLayers = memo(function FocusLayers() {
  return (
    <>
      <Pane name="mask" style={{ zIndex: 350 }}>
        <GeoJSON data={MASK} style={{ stroke: false, fillColor: COLORS.mask, fillOpacity: 0.55 }} interactive={false} />
        {NEIGHBOURS.map((district) => (
          <GeoJSON
            key={district.properties.id}
            data={district}
            style={{ color: '#ffffff', weight: 1.5, opacity: 0.7, dashArray: '4 4', fill: false }}
            interactive={false}
          />
        ))}
      </Pane>
      <GeoJSON data={FOCUS} style={{ color: COLORS.focusOutline, weight: 3, fill: false }} interactive={false} />
      {FRAME_SHAPES.map(({ frame, geometry }) => (
        <GeoJSON
          key={frame.id}
          data={geometry}
          interactive={false}
          style={
            frame.status === 'ready'
              ? { color: COLORS.frameOutline, weight: 2, fill: false }
              : { color: '#ffffff', weight: 2, dashArray: '6 6', fill: false }
          }
        />
      ))}
      <Pane name="labels" style={{ zIndex: 450 }}>
        {LABELS.map((label) => (
          <Marker key={label.id} position={label.position} icon={label.icon} interactive={false} keyboard={false} />
        ))}
      </Pane>
    </>
  );
});

// ---- Zones ----
const isSelected = (selected, kind, id) => selected?.kind === kind && selected.id === id;

const zoneLabel = (kind, p) => (kind === 'green' ? p.name : `Site ${p.id} · ${priorityTier(p.fitness).label}`);

function zoneStyle(kind, p, selected) {
  let base;
  if (kind === 'green') {
    base = { color: COLORS.greenZoneStroke, fillColor: COLORS.greenZoneFill, fillOpacity: 0.12 };
  } else {
    const tier = priorityTier(p.fitness);
    base = { color: tier.stroke, fillColor: tier.color, fillOpacity: 0.7 };
  }
  return isSelected(selected, kind, p.id) ? { ...base, color: COLORS.selected, weight: 3 } : { ...base, weight: 2 };
}

/** One layer of zone shapes. Styles update in place when the selection changes. */
function ZoneShapes({ kind, data, selected, onSelect }) {
  const layerRef = useRef(null);
  const latest = useRef({ selected, onSelect });

  useEffect(() => {
    latest.current = { selected, onSelect };
  });

  useEffect(() => {
    layerRef.current?.eachLayer((layer) => {
      const p = layer.feature.properties;
      layer.setStyle(zoneStyle(kind, p, selected));
      if (isSelected(selected, kind, p.id)) layer.bringToFront();
    });
  }, [kind, selected]);

  const style = useCallback((feature) => zoneStyle(kind, feature.properties, latest.current.selected), [kind]);

  const onEachFeature = useCallback(
    (feature, layer) => {
      const p = feature.properties;
      layer.bindTooltip(zoneLabel(kind, p), { sticky: true, direction: 'top' });
      layer.on({
        click: () => latest.current.onSelect({ kind, id: p.id }),
        mouseover: () => layer.setStyle({ weight: 3.5 }),
        mouseout: () => layer.setStyle(zoneStyle(kind, p, latest.current.selected)),
      });
    },
    [kind],
  );

  return <GeoJSON ref={layerRef} data={data} style={style} onEachFeature={onEachFeature} bubblingMouseEvents={false} />;
}

// ---- Map behaviour and controls ----
/** Lets the user zoom out a little past Don Mueang, but not further. Skipped while the map has no size. */
function updateMinZoom(map) {
  const size = map.getSize();
  if (size.x > 0 && size.y > 0) map.setMinZoom(Math.max(MAP_DEFAULTS.minZoom, map.getBoundsZoom(FOCUS_BOUNDS) - 0.75));
}

/** Fits Don Mueang once the map has a real size, keeps the zoom-out limit in step, clears on empty clicks. */
function MapEvents({ onReady, onEmptyClick }) {
  const map = useMapEvents({
    click: () => onEmptyClick(),
    resize: () => updateMinZoom(map),
  });
  useEffect(() => {
    // Leaflet only notices window resizes. Watch the container itself: it can start at 0 × 0 (or a
    // half-laid-out size) and fitting then would zoom all the way in.
    let fitted = false;
    const container = map.getContainer();
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
      if (!fitted && container.clientWidth > 0 && container.clientHeight > 0) {
        fitted = true;
        map.fitBounds(FOCUS_BOUNDS, FIT_OPTIONS);
        updateMinZoom(map);
      }
    });
    observer.observe(container);
    onReady(map);
    return () => observer.disconnect();
  }, [map, onReady]);
  return null;
}

const buttonClass =
  'flex size-9 items-center justify-center bg-white text-neutral-800 hover:bg-neutral-100 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-600';

function MapButtons({ map, onReset }) {
  return (
    <div className="absolute left-3 top-3 z-[1000] flex flex-col divide-y divide-black/10 overflow-hidden rounded-lg border border-black/15 shadow-md">
      <button type="button" className={buttonClass} aria-label="Zoom in" title="Zoom in" onClick={() => map?.zoomIn()}>
        <Plus size={18} aria-hidden="true" />
      </button>
      <button type="button" className={buttonClass} aria-label="Zoom out" title="Zoom out" onClick={() => map?.zoomOut()}>
        <Minus size={18} aria-hidden="true" />
      </button>
      <button type="button" className={buttonClass} aria-label="Reset view" title="Reset view" onClick={onReset}>
        <Maximize size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

/** The interactive map: Don Mueang focus, the green/grey grid of the frame, zones, controls and legend. */
export default function ZoneMap({ green, grey, classified, version, layers, onToggleLayer, selected, onSelect, onClear, loading }) {
  const [map, setMap] = useState(null);
  const resetView = useCallback(() => map?.fitBounds(FOCUS_BOUNDS, FIT_OPTIONS), [map]);

  return (
    <div className="relative h-[55vh] min-h-80 lg:h-dvh">
      <MapContainer
        center={FOCUS_BOUNDS.getCenter()}
        zoom={MAP_DEFAULTS.zoom}
        minZoom={MAP_DEFAULTS.minZoom}
        maxZoom={MAP_DEFAULTS.maxZoom}
        zoomSnap={0.25}
        maxBounds={VIEW_BOUNDS}
        maxBoundsViscosity={1}
        zoomControl={false}
        className="isolate size-full"
      >
        <TileLayer url={BASEMAP.url} attribution={BASEMAP.attribution} maxZoom={BASEMAP.maxZoom} className="basemap" />
        <MapEvents onReady={setMap} onEmptyClick={onClear} />
        <FocusLayers />
        <Pane name="grid" style={{ zIndex: 390 }}>
          {layers.grid && classified && <ClassifiedGridLayer frame={FOCUS_FRAME} classified={classified} pane="grid" />}
        </Pane>
        {layers.green && green && (
          <ZoneShapes key={`green-${version}`} kind="green" data={green} selected={selected} onSelect={onSelect} />
        )}
        {layers.grey && grey && (
          <ZoneShapes key={`grey-${version}`} kind="grey" data={grey} selected={selected} onSelect={onSelect} />
        )}
      </MapContainer>
      <MapButtons map={map} onReset={resetView} />
      <LayerControl layers={layers} onChange={onToggleLayer} />
      <MapLegend />
      {loading && (
        <p className="pointer-events-none absolute left-1/2 top-16 z-[1000] flex -translate-x-1/2 items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm text-neutral-800 shadow-md lg:top-3">
          <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />
          Loading zones…
        </p>
      )}
    </div>
  );
}
