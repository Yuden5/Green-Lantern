import { useEffect, useRef } from 'react';
import { COLORS, GREEN_NDVI } from '../../lib/constants.js';
import { TIER_ORDER } from '../../lib/metrics.js';

function Swatch({ color, outline = false }) {
  return (
    <span
      className="size-3 shrink-0 rounded-sm"
      style={outline ? { border: `2px solid ${color}` } : { background: color }}
      aria-hidden="true"
    />
  );
}

/** Floating legend (bottom-left of the map). Click "Legend" to fold or unfold it. */
export default function MapLegend() {
  const ref = useRef(null);

  // Open on desktop, folded on phones (where it would cover a big part of the small map).
  // Follows the breakpoint when the screen size changes; in between, the user's choice stays.
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)');
    const sync = () => {
      if (ref.current) ref.current.open = desktop.matches;
    };
    sync();
    desktop.addEventListener('change', sync);
    return () => desktop.removeEventListener('change', sync);
  }, []);

  return (
    <details
      ref={ref}
      className="group absolute bottom-6 left-3 z-[1000] rounded-lg border border-black/10 bg-white px-3 py-2 text-xs text-neutral-800 shadow-md"
    >
      <summary className="cursor-pointer select-none font-semibold group-open:mb-1">Legend</summary>
      <p className="mb-1 font-semibold">Grid (NDVI)</p>
      <p className="flex items-center gap-2">
        <Swatch color={COLORS.gridGreen} />
        Green ({GREEN_NDVI} and up)
      </p>
      <p className="flex items-center gap-2">
        <Swatch color={COLORS.gridGrey} />
        Grey (under {GREEN_NDVI})
      </p>
      <p className="mt-2 flex items-center gap-2">
        <Swatch color={COLORS.greenZoneStroke} outline />
        Green zone
      </p>
      <p className="mb-1 mt-2 font-semibold">Grey zone: priority to plant</p>
      <ul className="space-y-0.5">
        {TIER_ORDER.map((tier) => (
          <li key={tier.key} className="flex items-center gap-2">
            <Swatch color={tier.color} />
            {tier.short} ({tier.range})
          </li>
        ))}
      </ul>
      <p className="mt-2 flex items-center gap-2">
        <Swatch color={COLORS.mask} />
        Update soon
      </p>
    </details>
  );
}
