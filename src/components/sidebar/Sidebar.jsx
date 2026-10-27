import { Leaf } from 'lucide-react';
import { USING_MOCK_DATA } from '../../config.js';
import { COLORS } from '../../lib/constants.js';
import ErrorCard from '../ui/ErrorCard.jsx';
import LoadingCards from '../ui/LoadingCards.jsx';
import GreenZonePanel from './GreenZonePanel.jsx';
import GreyZonePanel from './GreyZonePanel.jsx';
import OverviewPanel from './OverviewPanel.jsx';

/** Properties of the selected zone, or null if nothing is selected or it is not in the data. */
function findZone(selected, green, grey) {
  if (!selected) return null;
  const collection = selected.kind === 'green' ? green : grey;
  return collection?.features.find((f) => f.properties.id === selected.id)?.properties ?? null;
}

function SidebarBody({ status, error, green, grey, classified, grid, selected, onClear, onRetry }) {
  if (status === 'loading') return <LoadingCards />;
  if (status === 'error') return <ErrorCard error={error} onRetry={onRetry} />;
  const zone = findZone(selected, green, grey);
  if (zone && selected.kind === 'green') return <GreenZonePanel zone={zone} onClose={onClear} />;
  if (zone && selected.kind === 'grey') {
    return <GreyZonePanel zone={zone} totalSites={grey.features.length} onClose={onClear} />;
  }
  return <OverviewPanel classified={classified} grid={grid} grey={grey} />;
}

/** Left column: app header + the overview or the selected zone's 4 cards. */
export default function Sidebar(props) {
  return (
    <aside
      aria-label="Zone statistics"
      className="flex flex-col gap-4 bg-app p-4 lg:h-dvh lg:overflow-y-auto lg:border-r lg:border-line"
    >
      <header className="flex items-center gap-3 border-b border-line pb-4">
        <Leaf size={26} color={COLORS.greenZoneFill} aria-hidden="true" />
        <div className="min-w-0">
          <h1 className="text-base font-semibold leading-tight text-ink">GreenSight</h1>
          <p className="text-xs text-ink-3">Don Mueang green space explorer</p>
        </div>
        {USING_MOCK_DATA && (
          <span
            className="ml-auto rounded-md border border-white/20 px-2 py-0.5 text-xs text-ink-2"
            title="Example data until the backend is connected"
          >
            Mock data
          </span>
        )}
      </header>
      <SidebarBody {...props} />
    </aside>
  );
}
