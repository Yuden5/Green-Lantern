import { useMemo } from 'react';
import HalfPieGauge from '../charts/HalfPieGauge.jsx';
import PriorityBar from '../charts/PriorityBar.jsx';
import Card from '../ui/Card.jsx';
import InfoList from '../ui/InfoList.jsx';
import StatPair from '../ui/StatPair.jsx';
import districts from '../../data/districts.json';
import { FOCUS_FRAME, FRAMES } from '../../data/frames.js';
import { COLORS, GREEN_NDVI } from '../../lib/constants.js';
import { formatKm2, formatLatLng, formatPercent } from '../../lib/format.js';
import { frameCenter, frameRing, polygonAreaM2 } from '../../lib/geo.js';
import { classAreas } from '../../lib/grid.js';
import { countByTier } from '../../lib/metrics.js';

const frameAreaM2 = (frame) => polygonAreaM2({ type: 'Polygon', coordinates: [frameRing(frame.corners)] });
const DISTRICT_M2 = polygonAreaM2(districts.features.find((f) => f.properties.role === 'focus').geometry);
const FOCUS_M2 = frameAreaM2(FOCUS_FRAME);
const OTHER_FRAMES = FRAMES.filter((frame) => frame.id !== FOCUS_FRAME.id);
const CORNERS = [
  ['Top-left', 'topLeft'],
  ['Top-right', 'topRight'],
  ['Bottom-left', 'bottomLeft'],
  ['Bottom-right', 'bottomRight'],
];

function Swatch({ color }) {
  return <span className="size-2.5 shrink-0 rounded-sm" style={{ background: color }} aria-hidden="true" />;
}

/** Sidebar content before anything is selected: green vs grey in the focus frame, areas and frames. */
export default function OverviewPanel({ classified, grid, grey }) {
  const areas = useMemo(() => (classified ? classAreas(FOCUS_FRAME, classified) : null), [classified]);
  const landM2 = areas ? areas.green + areas.grey : 0;
  const greenShare = landM2 > 0 ? areas.green / landM2 : null;
  const tiers = countByTier((grey?.features ?? []).map((f) => f.properties.fitness));
  const name = FOCUS_FRAME.id;

  return (
    <div className="space-y-3">
      <header>
        <h2 className="text-xl font-semibold text-ink">Don Mueang overview</h2>
        <p className="text-sm text-ink-3">Click a green or orange zone in the {name} frame to see its stats.</p>
      </header>
      <Card title={`Green and grey in ${name}`}>
        <HalfPieGauge
          fraction={greenShare}
          color={COLORS.gridGreen}
          trackColor={COLORS.gridGrey}
          value={formatPercent(greenShare)}
          unit="of the land is green"
          label={`${formatPercent(greenShare)} of the land in ${name} is green (NDVI ${GREEN_NDVI} and up).`}
        />
        <ul className="mt-2 space-y-1 text-sm">
          <li className="flex items-center gap-2">
            <Swatch color={COLORS.gridGreen} />
            <span className="text-ink">Green</span>
            <span className="text-xs text-ink-3">NDVI {GREEN_NDVI} and up</span>
            <span className="ml-auto tabular-nums text-ink">{formatKm2(areas?.green)}</span>
          </li>
          <li className="flex items-center gap-2">
            <Swatch color={COLORS.gridGrey} />
            <span className="text-ink">Grey</span>
            <span className="text-xs text-ink-3">under {GREEN_NDVI}</span>
            <span className="ml-auto tabular-nums text-ink">{formatKm2(areas?.grey)}</span>
          </li>
          <li className="flex items-center gap-2 text-xs text-ink-3">
            <span className="size-2.5 shrink-0" aria-hidden="true" />
            Water, not counted
            <span className="ml-auto tabular-nums">{formatKm2(areas?.water)}</span>
          </li>
        </ul>
      </Card>
      <Card title="Area">
        <StatPair
          items={[
            { label: `Frame ${name}`, value: formatKm2(FOCUS_M2) },
            { label: 'Don Mueang district', value: formatKm2(DISTRICT_M2) },
          ]}
          note={
            `The frame covers ${formatPercent(FOCUS_M2 / DISTRICT_M2)} of Don Mueang.` +
            (grid ? ` Grid: ${grid.rows} × ${grid.cols} cells${grid.cellSizeM ? ` of about ${grid.cellSizeM} m` : ''}.` : '')
          }
        />
      </Card>
      <Card title="Candidate sites by priority">
        <PriorityBar counts={tiers} />
      </Card>
      <Card title="Frame info">
        <InfoList
          rows={[
            ['Center', formatLatLng(frameCenter(FOCUS_FRAME.corners))],
            ...CORNERS.map(([label, key]) => [label, formatLatLng(FOCUS_FRAME.corners[key])]),
            ['Source', 'THEOS-2 (GISTDA)'],
          ]}
        />
        <h4 className="mb-1 mt-3 text-xs font-medium text-ink-2">Other frames</h4>
        <ul className="space-y-1.5 text-sm">
          {OTHER_FRAMES.map((frame) => (
            <li key={frame.id} className="flex items-center justify-between gap-2">
              <span className="min-w-0">
                <span className="text-ink">{frame.id}</span> <span className="text-xs text-ink-3">{frame.place}</span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <span className="tabular-nums text-ink-2">{formatKm2(frameAreaM2(frame))}</span>
                <span className="rounded-md border border-white/20 px-1.5 py-0.5 text-xs text-ink-2">Update soon</span>
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
