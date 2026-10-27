import { useEffect, useState } from 'react';
import Dashboard from '../App.jsx';
import HomePage from './pages/HomePage.jsx';
import PolicyPage from './pages/PolicyPage.jsx';
import DistrictAnalysisPage from './pages/DistrictAnalysisPage.jsx';

const pages = {
  home: { label: 'Home', title: 'GreenLantern | Greener spaces, closer to everyone' },
  policy: { label: 'Policy', title: 'Policy | GreenLantern' },
  'district-analysis': { label: 'District Analysis', title: 'District Analysis | GreenLantern' },
  dashboard: { label: 'Dashboard', title: 'Dashboard | GreenLantern' },
};

const navigationPages = ['home', 'policy', 'district-analysis'];

function currentPage() {
  const page = window.location.hash.replace(/^#\/?/, '').split('/')[0];
  return Object.hasOwn(pages, page) ? page : 'home';
}

function Navigation({ page }) {
  return (
    <header className="site-header">
      <nav className="site-nav" aria-label="Main navigation">
        {navigationPages.map((key) => (
          <a
            key={key}
            href={`#/${key}`}
            className={`site-nav-link${page === key ? ' is-active' : ''}`}
            aria-current={page === key ? 'page' : undefined}
          >
            {pages[key].label}
          </a>
        ))}
      </nav>
    </header>
  );
}

export default function SiteApp() {
  const [page, setPage] = useState(currentPage);

  useEffect(() => {
    const updatePage = () => setPage(currentPage());
    window.addEventListener('hashchange', updatePage);
    return () => window.removeEventListener('hashchange', updatePage);
  }, []);

  useEffect(() => {
    document.title = pages[page].title;
  }, [page]);

  return (
    <div className={`site site-page-${page}`}>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <Navigation page={page} />
      <main id="main-content" className="site-main">
        {page === 'home' && <HomePage />}
        {page === 'policy' && <PolicyPage />}
        {page === 'district-analysis' && <DistrictAnalysisPage />}
        {page === 'dashboard' && (
          <div className="dashboard-frame">
            <Dashboard />
          </div>
        )}
      </main>
    </div>
  );
}
