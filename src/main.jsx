import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'leaflet/dist/leaflet.css';
import './index.css';
import './site.css';
import './home.css';
import './policy.css';
import './district.css';
import './site/policyRefinements.css';
import SiteApp from './site/SiteApp.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SiteApp />
  </StrictMode>,
);