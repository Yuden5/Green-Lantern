import FactorBars from '../charts/FactorBars.jsx';
import HalfPieGauge from '../charts/HalfPieGauge.jsx';
import Card from '../ui/Card.jsx';
import InfoList from '../ui/InfoList.jsx';
import StatPair from '../ui/StatPair.jsx';
import PanelHeader from './PanelHeader.jsx';
import { COLORS } from '../../lib/constants.js';
import { DASH, formatDecimal, formatKm, formatKm2, formatNumber, formatTemp } from '../../lib/format.js';
import { m2PerPerson, ndviLabel, priorityTier } from '../../lib/metrics.js';

/** "Airfield grass 3 · 0.2 km", or "· next to it" when it is closer than 0.1 km. */
function nearestText(nearest) {
  if (!nearest?.name) return DASH;
  const distance = nearest.distanceKm != null && nearest.distanceKm < 0.1 ? 'next to it' : formatKm(nearest.distanceKm);
  return `${nearest.name} · ${distance}`;
}

/** Sidebar content for a selected grey zone (candidate site). */
export default function GreyZonePanel({ zone, totalSites, onClose }) {
  const tier = priorityTier(zone.fitness);
  const fitnessText = formatDecimal(zone.fitness, 2);
  const addedPerPerson = m2PerPerson(zone.areaM2, zone.populationNearby);
  const rows = [
    ['Land now', zone.ndvi == null ? DASH : `NDVI ${formatDecimal(zone.ndvi, 2)} · ${ndviLabel(zone.ndvi)}`],
    ['Nearest green zone', nearestText(zone.nearestGreenZone)],
    ['Surface temp', formatTemp(zone.surfaceTempC)],
    ['Data', 'THEOS-2, Landsat 8/9, OpenStreetMap'],
  ];
  if (zone.updatedAt) rows.push(['Updated', zone.updatedAt]);
  const rankText = zone.rank == null ? null : `rank ${zone.rank} of ${totalSites}`;

  return (
    <div className="space-y-3">
      <PanelHeader
        pill="Grey zone · candidate site"
        pillColor={COLORS.greyZoneText}
        pillBg="rgb(249 115 22 / 0.15)"
        title={`Site ${zone.id}`}
        subtitle={[zone.district, 'open land'].filter(Boolean).join(' · ')}
        onClose={onClose}
      />
      <Card title="Fitness score">
        <HalfPieGauge
          fraction={zone.fitness}
          color={COLORS.fitnessArc}
          value={fitnessText}
          unit="out of 1.00"
          label={`Fitness score ${fitnessText} out of 1. ${tier.label}.`}
        />
        <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-ink">
          <span className="size-2.5 rounded-sm ring-1 ring-white/25" style={{ background: tier.color }} aria-hidden="true" />
          {[tier.label, rankText].filter(Boolean).join(' · ')}
        </p>
      </Card>
      <Card title="Population and area">
        <StatPair
          items={[
            { label: `People within ${zone.nearbyRadiusKm} km`, value: formatNumber(zone.populationNearby) },
            { label: 'Site area', value: formatKm2(zone.areaM2) },
          ]}
          note={
            addedPerPerson == null ? null : `Greening it adds ${formatDecimal(addedPerPerson, 2)} m² per nearby person`
          }
        />
      </Card>
      <Card title="Why this site?">
        <FactorBars scores={zone.scores} penalty={zone.penalty} />
      </Card>
      <Card title="Info">
        <InfoList rows={rows} />
      </Card>
    </div>
  );
}
