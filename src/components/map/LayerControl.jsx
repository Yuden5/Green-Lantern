import { COLORS } from '../../lib/constants.js';

const LAYERS = [
  { key: 'grid', label: 'Green/grey grid', swatch: `linear-gradient(90deg, ${COLORS.gridGreen} 50%, ${COLORS.gridGrey} 50%)` },
  { key: 'green', label: 'Green zones', swatch: COLORS.greenZoneMark },
  { key: 'grey', label: 'Grey zones (sites)', swatch: COLORS.tierMedium },
];

/** Floating card (top-right of the map) to show or hide each layer. */
export default function LayerControl({ layers, onChange }) {
  return (
    <fieldset className="absolute right-3 top-3 z-[1000] rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-neutral-800 shadow-md">
      <legend className="sr-only">Map layers</legend>
      <p className="mb-1 font-semibold" aria-hidden="true">
        Layers
      </p>
      {LAYERS.map(({ key, label, swatch }) => (
        <label key={key} className="flex cursor-pointer items-center gap-2 py-0.5">
          <input
            type="checkbox"
            className="size-4 accent-neutral-800"
            checked={layers[key]}
            onChange={(event) => onChange(key, event.target.checked)}
          />
          <span className="size-3 rounded-sm" style={{ background: swatch }} aria-hidden="true" />
          {label}
        </label>
      ))}
    </fieldset>
  );
}
