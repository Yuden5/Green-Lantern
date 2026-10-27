import { useCallback, useEffect, useMemo, useState } from 'react';
import ZoneMap from './components/map/ZoneMap.jsx';
import Sidebar from './components/sidebar/Sidebar.jsx';
import useMapData from './hooks/useMapData.js';
import { classifyGrid } from './lib/grid.js';

export default function App() {
  const { status, error, green, grey, grid, version, reload } = useMapData();
  // The frontend decides every cell (green / grey / water) from its NDVI value.
  const classified = useMemo(() => (grid ? classifyGrid(grid) : null), [grid]);
  const [selected, setSelected] = useState(null); // { kind: 'green' | 'grey', id } or null
  const [layers, setLayers] = useState({ grid: true, green: true, grey: true });

  const clearSelection = useCallback(() => setSelected(null), []);

  const toggleLayer = useCallback((kind, visible) => {
    setLayers((prev) => ({ ...prev, [kind]: visible }));
    // Never keep showing stats for a zone the user just hid.
    if (!visible) setSelected((current) => (current?.kind === kind ? null : current));
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setSelected(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className="flex min-h-dvh flex-col-reverse lg:grid lg:h-dvh lg:grid-cols-[400px_minmax(0,1fr)]">
      <Sidebar
        status={status}
        error={error}
        green={green}
        grey={grey}
        classified={classified}
        grid={grid}
        selected={selected}
        onClear={clearSelection}
        onRetry={reload}
      />
      <main className="min-w-0">
        <ZoneMap
          green={green}
          grey={grey}
          classified={classified}
          version={version}
          layers={layers}
          onToggleLayer={toggleLayer}
          selected={selected}
          onSelect={setSelected}
          onClear={clearSelection}
          loading={status === 'loading'}
        />
      </main>
    </div>
  );
}
