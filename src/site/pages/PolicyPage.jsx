import { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import CircularGallery from '../components/CircularGallery.jsx';
import bangkokDistrictBoundaries from '../data/bangkokDistricts.json';
import bangkokDistrictStatistics from '../data/bangkokDistrictStatistics.json';
import { greenSpaceDistricts, totalDistrictGardens } from '../data/greenSpaceDistricts.js';
import target1Image from '../../images/target1.jpg';
import target2Image from '../../images/target2.jpg';
import target3Image from '../../images/target3.jpg';
import policyVisionImage from '../../images/p1.jpg';
import policyActionImage from '../../images/p2.jpg';
import policyParksImage from '../../images/p3.jpg';
import policyHackathonImage from '../../images/p4.png';
import policyTargetImage from '../../images/p5.jpg';

const policyTargets = [
  { value: 'Target 1', image: target1Image },
  { value: 'Target 2', image: target2Image },
  { value: 'Target 3', image: target3Image },
];

const milestones = [
  {
    year: '2019',
    title: 'The Vision',
    description: 'Bangkok sets three goals for 2030: 10 m² of green space per person, better walking access to parks, and 30% tree-canopy coverage.',
    image: policyVisionImage,
    imageAlt: 'Green Bangkok 2030 launch event with city representatives',
  },
  {
    year: '2021–2022',
    title: 'The Action',
    description: 'Pilot projects begin turning the city’s green ambitions into real places and neighbourhood improvements.',
    image: policyActionImage,
    imageAlt: 'A pilot neighborhood green-space project with seating and planted beds',
  },
  {
    year: '2022 onwards',
    title: '15-Minute Parks',
    description: 'Bangkok promotes nearby green spaces within an approximately 800-metre walk, including parks created from underused land.',
    image: policyParksImage,
    imageAlt: 'A planted pedestrian path through a Bangkok community garden',
  },
  {
    year: '2026',
    title: 'GeoHackathon',
    description: 'GreenLantern explores Suan Luang’s green-space distribution and local opportunities through geospatial analysis.',
    image: policyHackathonImage,
    imageAlt: 'GreenLantern project visual for exploring Suan Luang green spaces',
  },
  {
    year: '2030',
    title: 'The Target',
    description: 'The long-term goal: more green space, better access, and a greener urban canopy.',
    image: policyTargetImage,
    imageAlt: 'Aerial view of a large Bangkok park and the surrounding city',
  },
];

const reportedParks = 569;
const plannedTarget = 357;
const countScale = 600;
const attainmentScale = 200;
const targetAttainment = Math.round((reportedParks / plannedTarget) * 100);
const mapPalette = ['#e7f1df', '#c8dfb8', '#9fc98b', '#6fa667', '#34724b'];
const mapMetrics = [
  { value: 'gardens', label: '15-minute gardens', unit: 'gardens' },
  { value: 'greenSpacePerPersonM2', label: 'Green space per person', unit: 'm² / person' },
  { value: 'accessibleGreenSpacePerPersonM2', label: 'Accessible green space per person', unit: 'm² / person' },
];

function normalizeDistrictName(value) {
  return String(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function districtDataKey(name) {
  const normalized = normalizeDistrictName(name);
  return normalized === 'watthana' ? 'vadhana' : normalized;
}

const districtGardenMap = new Map(
  greenSpaceDistricts.map((district) => [districtDataKey(district.name), district.gardens]),
);
const districtStatisticsById = new Map(
  bangkokDistrictStatistics.records.map((record) => [record.districtId, record]),
);

function ringAreaKm2(ring) {
  const earthRadiusKm = 6371.0088;
  let area = 0;

  for (let index = 0; index < ring.length; index += 1) {
    const [longitude1, latitude1] = ring[index];
    const [longitude2, latitude2] = ring[(index + 1) % ring.length];
    const longitudeDelta = ((longitude2 - longitude1) * Math.PI) / 180;
    const latitude1Radians = (latitude1 * Math.PI) / 180;
    const latitude2Radians = (latitude2 * Math.PI) / 180;
    area += longitudeDelta * (2 + Math.sin(latitude1Radians) + Math.sin(latitude2Radians));
  }

  return Math.abs((area * earthRadiusKm * earthRadiusKm) / 2);
}

function districtAreaKm2(geometry) {
  const polygons = geometry.type === 'MultiPolygon' ? geometry.coordinates : [geometry.coordinates];

  return polygons.reduce((area, polygon) => {
    const [exterior, ...holes] = polygon;
    return area + ringAreaKm2(exterior) - holes.reduce((holeArea, ring) => holeArea + ringAreaKm2(ring), 0);
  }, 0);
}

const boundaryViewport = bangkokDistrictBoundaries.features.reduce(
  (bounds, feature) => {
    const { coordinates } = feature.geometry;
    const rings = feature.geometry.type === 'Polygon' ? [coordinates] : coordinates;

    rings.forEach((polygon) => {
      polygon.forEach((ring) => {
        ring.forEach(([lng, lat]) => {
          bounds.minLng = Math.min(bounds.minLng, lng);
          bounds.maxLng = Math.max(bounds.maxLng, lng);
          bounds.minLat = Math.min(bounds.minLat, lat);
          bounds.maxLat = Math.max(bounds.maxLat, lat);
        });
      });
    });

    return bounds;
  },
  { minLng: Number.POSITIVE_INFINITY, maxLng: Number.NEGATIVE_INFINITY, minLat: Number.POSITIVE_INFINITY, maxLat: Number.NEGATIVE_INFINITY },
);

const districtMapData = bangkokDistrictBoundaries.features.map((feature) => {
  const name = feature.properties.nameEn;
  const gardens = districtGardenMap.get(districtDataKey(name)) ?? null;
  const statistics = districtStatisticsById.get(feature.properties.id) ?? null;
  const district = {
    name,
    gardens,
    population: statistics?.population ?? null,
    areaKm2: districtAreaKm2(feature.geometry),
    greenSpaceAreaM2: statistics?.greenSpaceAreaM2 ?? null,
    greenSpacePerPersonM2: statistics?.greenSpacePerPersonM2 ?? null,
    accessibleGreenSpaceAreaM2: statistics?.accessibleGreenSpaceAreaM2 ?? null,
    accessibleGreenSpacePerPersonM2: statistics?.accessibleGreenSpacePerPersonM2 ?? null,
  };

  const buildPath = (ring) => {
    const width = 620;
    const height = 460;
    const padding = 26;
    const xScale = (width - padding * 2) / (boundaryViewport.maxLng - boundaryViewport.minLng || 1);
    const yScale = (height - padding * 2) / (boundaryViewport.maxLat - boundaryViewport.minLat || 1);

    return ring
      .map(([lng, lat], index) => {
        const x = padding + (lng - boundaryViewport.minLng) * xScale;
        const y = padding + (boundaryViewport.maxLat - lat) * yScale;
        return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(' ') + ' Z';
  };

  const polygons = feature.geometry.type === 'MultiPolygon'
    ? feature.geometry.coordinates
    : [feature.geometry.coordinates];

  return {
    ...district,
    path: polygons
      .map((polygon) => polygon.map((ring) => buildPath(ring)).join(' '))
      .join(' '),
  };
});

function metricValue(district, metric) {
  return metric === 'gardens' ? district.gardens : district[metric];
}

function getDistrictFill(value, breaks) {
  if (!Number.isFinite(value)) {
    return '#edf0eb';
  }

  const bucket = breaks.findIndex((limit) => value <= limit);
  return mapPalette[Math.max(0, bucket)];
}

function PerformanceChart({ view }) {
  const isCountView = view === 'count';
  const scale = isCountView ? countScale : attainmentScale;
  const reportedValue = isCountView ? reportedParks : (reportedParks / plannedTarget) * 100;
  const targetValue = isCountView ? plannedTarget : 100;
  const ticks = isCountView ? [0, 150, 300, 450, 600] : [0, 50, 100, 150, 200];
  const displayValue = (value) => (isCountView ? `${value}` : `${Math.round(value)}%`);

  return (
    <div
      className="policy-chart"
      role="img"
      aria-label={`Reported FY2025: ${displayValue(reportedValue)}. Planned target: ${displayValue(targetValue)}.`}
    >
      <div className="policy-chart-rows">
        <div className="policy-chart-row">
          <div className="policy-chart-label">
            <span>Reported FY2025</span>
            <strong>{isCountView ? '569 parks' : `${targetAttainment}% of planned target`}</strong>
          </div>
          <div className="policy-chart-track">
            <span
              className="policy-chart-bar policy-chart-bar-reported"
              style={{ '--policy-bar-width': `${Math.min((reportedValue / scale) * 100, 100)}%` }}
            />
          </div>
          <span className="policy-chart-value">{displayValue(reportedValue)}</span>
        </div>
        <div className="policy-chart-row">
          <div className="policy-chart-label">
            <span>Planned target</span>
            <strong>{isCountView ? '357 parks' : '100% of planned target'}</strong>
          </div>
          <div className="policy-chart-track">
            <span
              className="policy-chart-bar policy-chart-bar-target"
              style={{ '--policy-bar-width': `${(targetValue / scale) * 100}%` }}
            />
          </div>
          <span className="policy-chart-value">{displayValue(targetValue)}</span>
        </div>
      </div>
      <div className="policy-chart-axis" aria-hidden="true">
        {ticks.map((tick) => (
          <span key={tick}>{isCountView ? tick : `${tick}%`}</span>
        ))}
      </div>
      <p className="policy-chart-unit">Scale: {isCountView ? 'parks' : 'share of planned target'}</p>
    </div>
  );
}

function DistrictShareChart({ selectedDistrict, onSelectDistrict }) {
  const selectedValue = selectedDistrict?.gardens ?? null;
  const selectedShare = selectedValue === null ? null : (selectedValue / totalDistrictGardens) * 100;
  const [districtSearch, setDistrictSearch] = useState(selectedDistrict?.name ?? '');
  const [mapMetric, setMapMetric] = useState('gardens');
  const metric = mapMetrics.find(({ value }) => value === mapMetric);
  const metricValues = districtMapData
    .map((district) => metricValue(district, mapMetric))
    .filter(Number.isFinite)
    .sort((left, right) => left - right);
  const breaks = mapPalette.map((_, index) => {
    const position = Math.min(
      Math.ceil(((index + 1) / mapPalette.length) * metricValues.length) - 1,
      metricValues.length - 1,
    );
    return metricValues[position];
  });
  const formatMetricValue = (value) => (
    mapMetric === 'gardens'
      ? `${value}`
      : Number(value).toLocaleString('en-US', { maximumFractionDigits: 2 })
  );
  const searchResults = districtMapData.filter(({ name }) => (
    name.toLowerCase().includes(districtSearch.trim().toLowerCase())
  ));
  const selectDistrict = (name) => {
    onSelectDistrict(name);
    setDistrictSearch(name);
  };
  const selectDistrictFromSearch = (value) => {
    setDistrictSearch(value);
    const exactMatch = districtMapData.find(({ name }) => name.toLowerCase() === value.trim().toLowerCase());
    if (exactMatch) {
      onSelectDistrict(exactMatch.name);
    }
  };

  return (
    <div className="policy-district-explorer">
      <div className="policy-district-toolbar">
        <div className="policy-district-search">
          <label htmlFor="policy-district-search">Search a district</label>
          <input
            id="policy-district-search"
            type="search"
            list="policy-district-options"
            value={districtSearch}
            onChange={(event) => selectDistrictFromSearch(event.target.value)}
            placeholder="Type a district name"
            autoComplete="off"
          />
          <datalist id="policy-district-options">
            {searchResults.map(({ name }) => <option key={name} value={name} />)}
          </datalist>
        </div>
        <div className="policy-district-filter">
          <label htmlFor="policy-map-metric">Colour districts by</label>
          <select
            id="policy-map-metric"
            value={mapMetric}
            onChange={(event) => setMapMetric(event.target.value)}
          >
            {mapMetrics.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
      </div>
      <div className="policy-district-chart-layout">
        <svg
          className="policy-district-map"
          viewBox="0 0 620 460"
          role="group"
          aria-label={`Interactive Bangkok district map coloured by ${metric.label.toLowerCase()}`}
        >
          {districtMapData.map((district) => {
            const isSelected = district.name === selectedDistrict?.name;
            const value = metricValue(district, mapMetric);
            const fill = getDistrictFill(value, breaks);
            const label = value === null
              ? `${district.name}: ${metric.label.toLowerCase()} data unavailable`
              : `${district.name}: ${formatMetricValue(value)} ${metric.unit}`;

            return (
              <path
                key={district.name}
                className={`policy-district-slice${isSelected ? ' is-selected' : ''}`}
                d={district.path}
                fill={fill}
                style={{ fill }}
                stroke={isSelected ? '#1d4330' : 'rgba(29, 67, 48, 0.52)'}
                strokeWidth={isSelected ? 2.4 : 0.9}
                role="button"
                tabIndex={0}
                aria-label={label}
                aria-pressed={isSelected}
                onClick={() => selectDistrict(district.name)}
                onMouseEnter={() => selectDistrict(district.name)}
                onFocus={() => selectDistrict(district.name)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    selectDistrict(district.name);
                  }
                }}
              >
                <title>{label}</title>
              </path>
            );
          })}
        </svg>
        <div className="policy-map-legend" aria-label="District map legend">
          <span className="policy-map-legend-label">{metric.label} · {metric.unit}</span>
          <div className="policy-map-legend-scale" aria-hidden="true">
            {mapPalette.map((color) => <span key={color} style={{ background: color }} />)}
          </div>
          <span className="policy-map-legend-note">{metricValues.length ? formatMetricValue(metricValues[0]) : 'No data'}</span>
          <span className="policy-map-legend-note is-right">{metricValues.length ? formatMetricValue(metricValues.at(-1)) : 'No data'}</span>
          <span className="policy-map-legend-note is-missing">Grey · unavailable</span>
        </div>
        <aside className="policy-district-chart-detail" aria-label="Selected district information" aria-live="polite">
          {!selectedDistrict ? (
            <p className="policy-district-empty-state">Select a district to explore its green-space profile.</p>
          ) : (
            <>
              <p id="selected-district-name" className="policy-district-selected-name">{selectedDistrict.name}</p>
              <dl className="policy-district-metrics">
                <div>
                  <dt>Number of gardens in the dataset</dt>
                  <dd>{selectedDistrict.gardens === null ? 'Data unavailable' : `${selectedDistrict.gardens}`}</dd>
                </div>
                <div>
                  <dt>Population</dt>
                  <dd>{selectedDistrict.population?.toLocaleString('en-US') ?? 'Data unavailable'}</dd>
                </div>
                <div>
                  <dt>District area · estimated from boundary</dt>
                  <dd>{`${selectedDistrict.areaKm2.toLocaleString('en-US', { maximumFractionDigits: 2 })} km²`}</dd>
                </div>
                <div>
                  <dt>Green-space area</dt>
                  <dd>{selectedDistrict.greenSpaceAreaM2 === null ? 'Data unavailable' : `${selectedDistrict.greenSpaceAreaM2.toLocaleString('en-US', { maximumFractionDigits: 1 })} m²`}</dd>
                </div>
                <div>
                  <dt>Green space per person</dt>
                  <dd>{selectedDistrict.greenSpacePerPersonM2 === null ? 'Data unavailable' : `${selectedDistrict.greenSpacePerPersonM2.toLocaleString('en-US', { maximumFractionDigits: 2 })} m²`}</dd>
                </div>
                <div>
                  <dt>Accessible green space</dt>
                  <dd>{selectedDistrict.accessibleGreenSpaceAreaM2 === null ? 'Data unavailable' : `${selectedDistrict.accessibleGreenSpaceAreaM2.toLocaleString('en-US', { maximumFractionDigits: 1 })} m²`}</dd>
                </div>
                <div>
                  <dt>Accessible green space per person</dt>
                  <dd>{selectedDistrict.accessibleGreenSpacePerPersonM2 === null ? 'Data unavailable' : `${selectedDistrict.accessibleGreenSpacePerPersonM2.toLocaleString('en-US', { maximumFractionDigits: 2 })} m²`}</dd>
                </div>
              </dl>
              <p className="policy-district-selected-share">
                {selectedShare === null
                  ? 'Garden-count data is unavailable for this district.'
                  : <><strong>{selectedValue}</strong> gardens · {selectedShare.toFixed(1)}% of the reported citywide total</>}
              </p>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

function ParkIllustration() {
  return (
    <svg
      className="policy-park-illustration"
      viewBox="0 0 480 340"
      role="img"
      aria-labelledby="policy-park-title"
      aria-describedby="policy-park-description"
    >
      <title id="policy-park-title">A geometric neighborhood park</title>
      <desc id="policy-park-description">
        An isometric park with a leafy tree, a shaded pavilion, a path, a bench and a round play structure.
      </desc>
      <path className="park-ground-shadow" d="m44 204 190-108 205 117-192 111z" />
      <path className="park-ground" d="m54 194 180-102 194 111-182 103z" />
      <path className="park-path" d="m166 154 58-33 114 65-58 34z" />
      <path className="park-path-edge" d="m166 154 58-33 114 65-58 34z" />
      <path className="park-water" d="m278 222 53-30 43 25-53 31z" />
      <path className="park-trunk" d="m113 185 1-75 17-10 1 77zm203 83v-70l10-6v71z" />
      <path className="park-canopy-back" d="m80 86 46-28 49 28-2 47-46 27-48-27z" />
      <path className="park-canopy" d="m71 83 55-32 58 33-2 45-55 32-56-32z" />
      <path className="park-canopy-facet" d="m71 83 56 31 57-30m-57 30v47m-56-78 56 31 2-63" />
      <path className="park-pavilion-posts" d="m213 173v-54m59 87v-53m-59 53v-54m59 87v-54" />
      <path className="park-pavilion-roof" d="m192 111 53-31 77 44-53 31z" />
      <path className="park-pavilion-roof-facet" d="m192 111 77 44 53-31m-77 44v-64" />
      <path className="park-bench" d="m337 161 48 27m-46-14 47 27m-35-30v26m25-13v26" />
      <ellipse className="park-play-ring" cx="278" cy="132" rx="39" ry="21" />
      <path className="park-play-lines" d="m239 132 39-21 39 21m-78 0 39 21 39-21m-39-21v42m-25-34 50 26m-50 0 50-26" />
      <path className="park-shrub" d="m133 224 16-9 17 10-16 10zm48-27 13-8 14 8-14 9zm152 63 14-8 15 9-15 9z" />
      <circle className="park-flower" cx="146" cy="223" r="3" />
      <circle className="park-flower" cx="191" cy="200" r="3" />
      <circle className="park-flower" cx="345" cy="259" r="3" />
      <g className="park-falling-leaves" aria-hidden="true">
        <path className="park-falling-leaf" d="M176 39c7-8 17-7 18-6-1 9-9 15-18 6zm1-1 12-4" />
        <path className="park-falling-leaf" d="M224 18c7-8 17-7 18-6-1 9-9 15-18 6zm1-1 12-4" />
        <path className="park-falling-leaf" d="M281 43c7-8 17-7 18-6-1 9-9 15-18 6zm1-1 12-4" />
        <path className="park-falling-leaf" d="M332 27c7-8 17-7 18-6-1 9-9 15-18 6zm1-1 12-4" />
        <path className="park-falling-leaf" d="M370 62c7-8 17-7 18-6-1 9-9 15-18 6zm1-1 12-4" />
      </g>
    </svg>
  );
}

export default function PolicyPage() {
  const [performanceView, setPerformanceView] = useState('count');
  const [selectedDistrictName, setSelectedDistrictName] = useState('');
  const selectedDistrict = districtMapData.find(({ name }) => name === selectedDistrictName) ?? null;

  return (
    <div className="policy-page">
      <div className="policy-container">
        <header className="policy-hero">
          <div className="policy-hero-copy">
            <h1 className="policy-main-title">Green Bangkok 2030</h1>
            <p>
              Launched in December 2019 by the Bangkok Metropolitan Administration, Green Bangkok 2030
              is a collaborative urban initiative turning unused public and private spaces into
              accessible green areas.
            </p>
            <a className="policy-hero-link" href="https://greener.bangkok.go.th/en/green-space/" target="_blank" rel="noreferrer">
              Visit official website <ArrowUpRight size={17} aria-hidden="true" />
            </a>
          </div>
          <div className="policy-hero-mark">
            <ParkIllustration />
          </div>
        </header>

        <section id="policy-targets" className="policy-section policy-targets-section" aria-labelledby="targets-heading">
          <div className="policy-section-heading">
            <h2 id="targets-heading" className="policy-section-title">The 3 Targets</h2>
            <p>Three measures define the city’s stated green-space ambition.</p>
          </div>
          <CircularGallery items={policyTargets} />
          
        </section>

        <section className="policy-section policy-performance-section" aria-labelledby="performance-heading">
          <div className="policy-performance-intro">
            <h2 id="performance-heading" className="policy-section-title">Reported delivery</h2>
            <p>
              The FY2025 report cites 569 15-minute parks against a planned target of 357.
              Compare the figures as counts or as a share of the planned target.
            </p>
          </div>
          <div className="policy-performance-display">
            <div className="policy-performance-topline">
              <div>
                <p className="policy-performance-stat">{reportedParks}<span>parks</span></p>
              </div>
              <div className="policy-performance-target">
                <span>Planned target</span>
                <strong>{plannedTarget} parks</strong>
              </div>
            </div>
            <div className="policy-performance-toggle" role="group" aria-label="Performance chart view">
              <button
                type="button"
                aria-pressed={performanceView === 'count'}
                onClick={() => setPerformanceView('count')}
              >
                Park counts
              </button>
              <button
                type="button"
                aria-pressed={performanceView === 'attainment'}
                onClick={() => setPerformanceView('attainment')}
              >
                Share of target
              </button>
            </div>
            <PerformanceChart view={performanceView} />
            <p className="policy-performance-note">
              {performanceView === 'count'
                ? 'Reported and planned counts as stated in the Policy source.'
                : `About ${targetAttainment}% of the planned target, calculated from 569 reported parks ÷ 357 planned parks.`}
            </p>
          </div>
        </section>

        <section className="policy-section policy-district-section" aria-labelledby="district-share-heading">
          <div className="policy-section-heading">
            <h2 id="district-share-heading" className="policy-section-title">Explore Bangkok’s districts</h2>
            <p>
              Explore the 50 districts by garden counts, green space per person, or accessible green
              space. Select a district to view the figures available in the source data.
            </p>
          </div>
          <DistrictShareChart
            selectedDistrict={selectedDistrict}
            onSelectDistrict={setSelectedDistrictName}
          />
          <p className="policy-district-source">
            Source: <a href="https://greener.bangkok.go.th/en/map-15-minute-garden/" target="_blank" rel="noreferrer">
              15-Minute Garden district data
            </a>. Statistics come from the project’s Bangkok Districts workbook.
          </p>
        </section>

        <section className="policy-section policy-timeline-section" aria-labelledby="timeline-heading">
          <div className="policy-section-heading">
            <h2 id="timeline-heading" className="policy-section-title">From policy to implementation</h2>
            <p>
              Follow the path from a citywide goal to public progress measures and a neighborhood-scale view.
              The official counters are undated and may change.
            </p>
          </div>
          <div className="policy-timeline-scene">
            <ol className="policy-timeline">
              {milestones.map(({ year, title, description, image, imageAlt }) => (
                <li className="policy-milestone" key={year}>
                  <div className="policy-milestone-copy">
                    <span className="policy-milestone-year">{year}</span>
                    <h3>{title}</h3>
                    <p>{description}</p>
                  </div>
                  <span className="policy-milestone-marker" aria-hidden="true" />
                  <img className="policy-milestone-image" src={image} alt={imageAlt} />
                </li>
              ))}
            </ol>
          </div>
        </section>
      </div>
    </div>
  );
}
