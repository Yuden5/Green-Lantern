import { useEffect, useState } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import nineCenterImage from '../../images/15 minute garden @The Nine Center Rama 9 (Soi Rama 9 41).png';
import watPakBoImage from '../../images/Suan Lan Thammachak Wat Pak Bo.png';
import pttOnNutImage from '../../images/Garden in PTT gas stationOn Nut 51 On Nut Road.jpg';
import rama9Soi49Image from '../../images/Garden 15 minutes @Rama 9 (Soi 49).png';
import phatthanakanParkImage from '../../images/Suan Phatthanakan Like Park, Soi Phatthanakan 25.png';
import saranromImage from '../../images/Suan Luang Saranrom.png';

const districtProfileMetrics = [
  { value: '123,291', label: 'Population of Suan Luang' },
  { value: '6.09 m²', label: 'Green space per capita' },
  { value: '20/50', label: 'District ranking out of 50 districts' },
  { value: '1.69 m²', label: 'Accessible garden area per capita' },
];

const siteComparisonData = [
  {
    name: 'The garden for 15 minutes @the nine center Rama IX (Soi Rama IX 41)',
    latitude: 13.740865,
    longitude: 100.623327,
    coordinates: '13.740865, 100.623327',
    area: 50,
    formatted: '50.00',
    development: 'Develop a green area new',
    developmentKind: 'new',
    owner: 'Private',
    ownerKind: 'private',
    image: nineCenterImage,
  },
  {
    name: 'Garden patio th Wat Pak Bo',
    latitude: 13.714647,
    longitude: 100.630935,
    coordinates: '13.714647, 100.630935',
    area: 224.8,
    formatted: '224.80',
    development: 'Develop a green area new',
    developmentKind: 'new',
    owner: 'Places of worship and schools',
    ownerKind: 'community',
    image: watPakBoImage,
  },
  {
    name: 'Gardens in the gas station PTT. Nut 51 on nut road',
    latitude: 13.716853,
    longitude: 100.650043,
    coordinates: '13.716853, 100.650043',
    area: 400,
    formatted: '400.00',
    development: 'Develop a green area new',
    developmentKind: 'new',
    owner: 'Private',
    ownerKind: 'private',
    image: pttOnNutImage,
  },
  {
    name: 'The garden for 15 minutes @ditch school.',
    latitude: 13.7329672,
    longitude: 100.6382334,
    coordinates: '13.7329672, 100.6382334',
    area: 400,
    formatted: '400.00',
    development: 'Develop a green area new',
    developmentKind: 'new',
    owner: 'Bangkok',
    ownerKind: 'bangkok',
  },
  {
    name: 'The garden for 15 minutes @Rama 9 (Soi 49)',
    latitude: 13.748099,
    longitude: 100.631329,
    coordinates: '13.748099, 100.631329',
    area: 780,
    formatted: '780.00',
    development: 'Develop a green area new',
    developmentKind: 'new',
    owner: 'Bangkok',
    ownerKind: 'bangkok',
    image: rama9Soi49Image,
  },
  {
    name: 'Garden development like Park Soi phatthanakan 25',
    latitude: 13.738804,
    longitude: 100.616034,
    coordinates: '13.738804, 100.616034',
    area: 864,
    formatted: '864.00',
    development: 'Develop a green area new',
    developmentKind: 'new',
    owner: 'Bangkok',
    ownerKind: 'bangkok',
    image: phatthanakanParkImage,
  },
  {
    name: 'The garden for 15 minutes@community develop',
    latitude: 13.734081,
    longitude: 100.62223,
    coordinates: '13.734081, 100.62223',
    area: 1600,
    formatted: '1,600.00',
    development: 'Develop a green area new',
    developmentKind: 'new',
    owner: 'Bangkok',
    ownerKind: 'bangkok',
  },
  {
    name: 'Suan Luang saranrom',
    latitude: 13.736548,
    longitude: 100.630168,
    coordinates: '13.736548, 100.630168',
    area: 3424,
    formatted: '3,424.00',
    development: 'Improve green spaces, original',
    developmentKind: 'improved',
    owner: 'Bangkok',
    ownerKind: 'bangkok',
    image: saranromImage,
  },
  {
    name: 'Garden sriphat phirom',
    latitude: 13.7350756,
    longitude: 100.6408915,
    coordinates: '13.7350756, 100.6408915',
    area: 3600,
    formatted: '3,600.00',
    development: 'Develop a green area new',
    developmentKind: 'new',
    owner: 'Bangkok',
    ownerKind: 'bangkok',
  },
  {
    name: 'Friendship Park phirom',
    latitude: 13.7051741,
    longitude: 100.6398471,
    coordinates: '13.7051741, 100.6398471',
    area: 7308,
    formatted: '7,308.00',
    development: 'Develop a green area new',
    developmentKind: 'new',
    owner: 'Bangkok',
    ownerKind: 'bangkok',
  },
];

const officialMapUrl = 'https://greener.bangkok.go.th/en/map-15-minute-garden/';

const formatAreaInRai = (area) => `${(area / 1600).toFixed(2)} rai`;

const escapeHtml = (text) =>
  String(text).replace(/[&<>"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
  })[character]);

function createSiteIcon(site, isSelected) {
  const size = Math.round(20 + Math.sqrt(site.area) / 5);
  const label = `Select ${site.name} on map`;
  const selectedClass = isSelected ? ' is-selected' : '';
  const html = `<button type="button" class="site-map-marker is-${site.developmentKind} owner-${site.ownerKind}${selectedClass}" style="--marker-size:${size}px" aria-label="${escapeHtml(label)}" aria-pressed="${isSelected}" title="${escapeHtml(`${site.name} · ${site.formatted} m²`)}"></button>`;

  return L.divIcon({
    className: 'site-map-icon',
    html,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  });
}

function FitSiteBounds() {
  const map = useMap();

  useEffect(() => {
    const bounds = L.latLngBounds(siteComparisonData.map(({ latitude, longitude }) => [latitude, longitude]));
    map.fitBounds(bounds, { padding: [36, 36], maxZoom: 14 });
  }, [map]);

  return null;
}

function SiteComparisonChart() {
  const [selectedSiteIndex, setSelectedSiteIndex] = useState(0);
  const selectedSite = siteComparisonData[selectedSiteIndex];

  return (
    <section className="site-chart-section" aria-labelledby="site-chart-title">
      <div className="site-chart-card">
        <h2 id="site-chart-title" className="district-visually-hidden">
          Selected green sites in Suan Luang
        </h2>
        <div className="site-map-layout">
          <div className="site-map" role="region" aria-label="Interactive map of selected Suan Luang green sites">
            <MapContainer
              center={[13.732, 100.633]}
              zoom={12}
              scrollWheelZoom={false}
              aria-label="Interactive map of selected Suan Luang green sites"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxZoom={19}
              />
              <FitSiteBounds />
              {siteComparisonData.map((site, index) => (
                <Marker
                  key={site.name}
                  position={[site.latitude, site.longitude]}
                  icon={createSiteIcon(site, selectedSiteIndex === index)}
                  title={`Select ${site.name} on map`}
                  eventHandlers={{ click: () => setSelectedSiteIndex(index) }}
                />
              ))}
            </MapContainer>
          </div>
          <aside className="site-map-info" aria-live="polite" aria-label="Selected park details">
            {selectedSite.image && (
              <img className="site-map-info-image" src={selectedSite.image} alt={selectedSite.name} />
            )}
            <h3>{selectedSite.name}</h3>
            <dl className="site-map-info-details">
              <div>
                <dt>Coordinates</dt>
                <dd>{selectedSite.coordinates}</dd>
              </div>
              <div>
                <dt>Development area</dt>
                <dd>{selectedSite.development}</dd>
              </div>
              <div>
                <dt>Area</dt>
                <dd>{formatAreaInRai(selectedSite.area)}</dd>
              </div>
              <div>
                <dt>Area (m²)</dt>
                <dd>{selectedSite.formatted} m²</dd>
              </div>
              <div>
                <dt>Owner type</dt>
                <dd>{selectedSite.owner}</dd>
              </div>
            </dl>
          </aside>
        </div>
        <div className="site-map-legends" aria-label="Map legends">
          <section className="site-map-legend" aria-labelledby="development-legend-title">
            <h4 id="development-legend-title">Development type</h4>
            <ul>
              <li><span className="site-legend-swatch is-new" aria-hidden="true" />New green-space development</li>
              <li><span className="site-legend-swatch is-improved" aria-hidden="true" />Improvement of existing green space</li>
            </ul>
          </section>
          <section className="site-map-legend" aria-labelledby="ownership-legend-title">
            <h4 id="ownership-legend-title">Land owner area type</h4>
            <ul>
              <li><span className="site-legend-swatch owner-bangkok" aria-hidden="true" />Bangkok</li>
              <li><span className="site-legend-swatch owner-private" aria-hidden="true" />Private</li>
              <li><span className="site-legend-swatch owner-community" aria-hidden="true" />Places of worship and schools</li>
            </ul>
          </section>
          <p className="site-map-size-key">
            Marker fill shows development type; its outline shows land owner. Size reflects site area.
            The selected site is yellow. Select a marker or site name to view details.
          </p>
        </div>
        <div className="site-table-wrap">
          <table className="site-data-table">
            <caption>Selected green sites in Suan Luang</caption>
            <thead>
              <tr>
                <th scope="col">Green site</th>
                <th scope="col">Coordinates (latitude, longitude)</th>
                <th scope="col">Area (rai)</th>
                <th scope="col">Area (m²)</th>
                <th scope="col">Development area</th>
                <th scope="col">Land owner area type</th>
              </tr>
            </thead>
            <tbody>
              {siteComparisonData.map((site, index) => (
                <tr className={selectedSiteIndex === index ? 'is-selected' : ''} key={site.name}>
                  <th scope="row">
                    <button
                      type="button"
                      className="site-table-select"
                      aria-label={`Show ${site.name} on map`}
                      aria-pressed={selectedSiteIndex === index}
                      onClick={() => setSelectedSiteIndex(index)}
                    >
                      {site.name}
                    </button>
                  </th>
                  <td>{site.coordinates}</td>
                  <td className="site-chart-area">{formatAreaInRai(site.area)}</td>
                  <td className="site-chart-area">{site.formatted} m²</td>
                  <td>{site.development}</td>
                  <td>{site.owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="site-chart-unit">
          Park details from the supplied Suan Luang parks list. Basemap © OpenStreetMap contributors.{' '}
          <a href={officialMapUrl} target="_blank" rel="noreferrer">Open the official 15-minute park map</a>.
        </p>
      </div>
    </section>
  );
}

export default function DistrictAnalysisPage() {
  return (
    <div className="district-page">
      <div className="district-container">
        <section className="district-section district-profile-section" aria-labelledby="section-profile-heading">
          <h1 id="section-profile-heading" className="district-main-title">
            Area of Study: Suan Luang District
          </h1>
          <div className="district-profile-grid">
            {districtProfileMetrics.map(({ value, label }) => (
              <article className="district-card" key={label}>
                <div className="district-card-value">{value}</div>
                <div className="district-card-label">{label}</div>
              </article>
            ))}
          </div>
        </section>

        <section className="district-section district-distribution-section" aria-label="Green space distribution">
          <SiteComparisonChart />
        </section>
      </div>
    </div>
  );
}
